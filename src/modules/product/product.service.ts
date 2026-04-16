import { BadRequestException, Injectable } from '@nestjs/common'
import { ProductRepository } from './product.repository'
import { createResponse, currencyBriefMapFromRows, ERROR_MSG, withCurrencyBriefTotalMany } from '@common'
import { ProductCreateOneRequest, ProductFindManyRequest, ProductFindOneRequest, ProductGetManyRequest, ProductGetOneRequest, ProductUpdateOneRequest } from './interfaces'
import type { ProductFindManyCalc } from './interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { CurrencyRepository } from '../currency/currency.repository'

type PriceAggRow = { type: PriceTypeEnum; totalPrice: Decimal; currencyId: string }

type MoneyMaps = { cost: Map<string, Decimal>; selling: Map<string, Decimal>; wholesale: Map<string, Decimal> }

@Injectable()
export class ProductService {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly excelService: ExcelService,
		private readonly currencyRepository: CurrencyRepository,
	) {}

	private emptyMoneyMaps(): MoneyMaps {
		return { cost: new Map(), selling: new Map(), wholesale: new Map() }
	}

	private pickMoneyMap(maps: MoneyMaps, type: PriceTypeEnum): Map<string, Decimal> | null {
		switch (type) {
			case PriceTypeEnum.cost:
				return maps.cost
			case PriceTypeEnum.selling:
				return maps.selling
			case PriceTypeEnum.wholesale:
				return maps.wholesale
			default:
				return null
		}
	}

	private addToMoneyMap(maps: MoneyMaps, price: PriceAggRow) {
		const map = this.pickMoneyMap(maps, price.type)
		if (!map) return
		map.set(price.currencyId, (map.get(price.currencyId) ?? new Decimal(0)).plus(price.totalPrice))
	}

	private addInventoryRowToMaps(maps: MoneyMaps, row: { count: number; prices: PriceAggRow[] }) {
		for (const pr of row.prices) {
			this.addToMoneyMap(maps, pr)
		}
	}

	private addMappedProductToMaps(
		maps: MoneyMaps,
		p: {
			prices: {
				cost?: { totalPrice?: Decimal | null; currencyId?: string | null; currency?: { id: string } | null }
				selling?: { totalPrice?: Decimal | null; currencyId?: string | null; currency?: { id: string } | null }
				wholesale?: { totalPrice?: Decimal | null; currencyId?: string | null; currency?: { id: string } | null }
			}
		},
	) {
		const bump = (slot: keyof MoneyMaps, row: { totalPrice?: Decimal | null; currencyId?: string | null; currency?: { id: string } | null } | null | undefined) => {
			if (row == null || row.totalPrice === undefined || row.totalPrice === null) return
			const currencyId = row.currencyId ?? row.currency?.id
			if (!currencyId) return
			const map = maps[slot]
			map.set(currencyId, (map.get(currencyId) ?? new Decimal(0)).plus(new Decimal(row.totalPrice)))
		}
		bump('cost', p.prices.cost)
		bump('selling', p.prices.selling)
		bump('wholesale', p.prices.wholesale)
	}

	private buildCalcFromMaps(activeCurrencyIds: string[], maps: MoneyMaps, briefMap: ReturnType<typeof currencyBriefMapFromRows>): Omit<ProductFindManyCalc, 'totalCount'> {
		const toRows = (m: Map<string, Decimal>) => activeCurrencyIds.map((currencyId) => ({ currencyId, total: m.get(currencyId) ?? new Decimal(0) }))
		return {
			totalCosts: withCurrencyBriefTotalMany(toRows(maps.cost), briefMap),
			totalPrices: withCurrencyBriefTotalMany(toRows(maps.selling), briefMap),
			totalWholesales: withCurrencyBriefTotalMany(toRows(maps.wholesale), briefMap),
		}
	}

	async findMany(query: ProductFindManyRequest) {
		const products = await this.productRepository.findMany(query)
		const productsCount = await this.productRepository.countFindMany(query)
		const inventoryRows = await this.productRepository.findManyForInventoryCalc(query)
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()
		const briefRows = await this.currencyRepository.findBriefByIds(activeCurrencyIds)
		const briefMap = currencyBriefMapFromRows(briefRows)

		const totalMaps = this.emptyMoneyMaps()
		let totalCount = 0
		for (const row of inventoryRows) {
			totalCount += row.count
			this.addInventoryRowToMaps(totalMaps, row as { count: number; prices: PriceAggRow[] })
		}

		const mappedProducts = products.map((p) => {
			const lastSellingMV = p.sellingMVs?.length ? p.sellingMVs[0] : null

			const { sellingMVs: _, ...rest } = p

			return {
				...rest,
				lastSellingDate: lastSellingMV?.selling?.date ?? null,
				lastSellingPrice: lastSellingMV?.prices?.find((pr) => pr.type === PriceTypeEnum.selling)?.price ?? lastSellingMV?.prices?.[0]?.price ?? null,
				lastSellingCount: lastSellingMV?.count ?? null,
				prices: {
					cost: p.prices.find((pri) => pri.type === PriceTypeEnum.cost),
					selling: p.prices.find((pri) => pri.type === PriceTypeEnum.selling),
					wholesale: p.prices.find((pri) => pri.type === PriceTypeEnum.wholesale),
				},
			}
		})

		const sortedProducts = mappedProducts.sort((a, b) => {
			if (!a.lastSellingDate && !b.lastSellingDate) return 0
			if (!a.lastSellingDate) return 1
			if (!b.lastSellingDate) return -1
			return new Date(b.lastSellingDate).getTime() - new Date(a.lastSellingDate).getTime()
		})

		const pageMaps = this.emptyMoneyMaps()
		let pageCount = 0
		for (const p of sortedProducts) {
			pageCount += p.count
			this.addMappedProductToMaps(pageMaps, p)
		}

		const calcTotal: ProductFindManyCalc = {
			totalCount,
			...this.buildCalcFromMaps(activeCurrencyIds, totalMaps, briefMap),
		}
		const calcPage: ProductFindManyCalc = {
			totalCount: pageCount,
			...this.buildCalcFromMaps(activeCurrencyIds, pageMaps, briefMap),
		}

		const calc = { calcPage, calcTotal }

		const result = query.pagination
			? {
					totalCount: productsCount,
					pagesCount: Math.ceil(productsCount / query.pageSize),
					pageSize: sortedProducts.length,
					data: sortedProducts,
					calc,
				}
			: { data: sortedProducts, calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ProductFindOneRequest) {
		const product = await this.productRepository.findOne(query)

		if (!product) {
			throw new BadRequestException(ERROR_MSG.PRODUCT.NOT_FOUND.UZ)
		}

		const lastSellingMV = product.sellingMVs?.length ? product.sellingMVs[0] : null

		const { sellingMVs: _, ...rest } = product

		const result = {
			...rest,
			lastSellingDate: lastSellingMV?.selling?.date ?? null,
			lastSellingPrice: lastSellingMV?.prices?.find((pr) => pr.type === PriceTypeEnum.selling)?.price ?? lastSellingMV?.prices?.[0]?.price ?? null,
			lastSellingCount: lastSellingMV?.count ?? null,
			prices: {
				cost: product.prices.find((pri) => pri.type === PriceTypeEnum.cost),
				selling: product.prices.find((pri) => pri.type === PriceTypeEnum.selling),
				wholesale: product.prices.find((pri) => pri.type === PriceTypeEnum.wholesale),
			},
		}

		return createResponse({ data: result, success: { messages: ['find one success'] } })
	}

	async getMany(query: ProductGetManyRequest) {
		const products = await this.productRepository.getMany(query)
		const productsCount = await this.productRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(productsCount / query.pageSize),
					pageSize: products.length,
					data: products,
				}
			: { data: products }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ProductGetOneRequest) {
		const product = await this.productRepository.getOne(query)

		if (!product) {
			throw new BadRequestException(ERROR_MSG.PRODUCT.NOT_FOUND.UZ)
		}

		return createResponse({ data: product, success: { messages: ['get one success'] } })
	}

	async createOne(body: ProductCreateOneRequest) {
		const candidate = await this.productRepository.getOne({ name: body.name })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.PRODUCT.NAME_EXISTS.UZ)
		}

		await this.productRepository.createOne(body)

		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ProductGetOneRequest, body: ProductUpdateOneRequest) {
		const current = await this.productRepository.getOneWithPrices(query)
		if (!current) {
			throw new BadRequestException(ERROR_MSG.PRODUCT.NOT_FOUND.UZ)
		}

		if (body.name) {
			const candidate = await this.productRepository.getOne({ name: body.name })
			if (candidate && candidate.id !== current.id) {
				throw new BadRequestException(ERROR_MSG.PRODUCT.NAME_EXISTS.UZ)
			}
		}

		await this.productRepository.updateOne(query, body)

		const newCount = body.count !== undefined ? body.count : current.count
		const needPriceUpdate = body.count !== undefined || body.prices

		if (needPriceUpdate) {
			const currencyIds = new Set<string>()
			for (const priceRecord of current.prices) {
				const typeKey = priceRecord.type as 'cost' | 'selling' | 'wholesale'
				const priceInput = body.prices?.[typeKey]
				const newCurrencyId = priceInput?.currencyId ?? priceRecord.currencyId
				currencyIds.add(newCurrencyId)
			}
			const exchangeRateByCurrencyId = await this.productRepository.findCurrencyExchangeRatesByIds([...currencyIds])

			for (const priceRecord of current.prices) {
				const typeKey = priceRecord.type as 'cost' | 'selling' | 'wholesale'
				const priceInput = body.prices?.[typeKey]

				const newPrice = priceInput?.price !== undefined ? new Decimal(priceInput.price) : new Decimal(priceRecord.price)
				const newCurrencyId = priceInput?.currencyId ?? priceRecord.currencyId
				const newTotalPrice = new Decimal(newCount).mul(newPrice)
				const exchangeRate = exchangeRateByCurrencyId.get(newCurrencyId) ?? new Decimal(0)

				await this.productRepository.updateProductPrice(priceRecord.id, {
					price: newPrice,
					totalPrice: newTotalPrice,
					currencyId: newCurrencyId,
					exchangeRate,
				})
			}
		}

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ProductGetOneRequest) {
		await this.getOne(query)

		await this.productRepository.deleteOne(query)

		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: ProductFindManyRequest) {
		return this.excelService.productDownloadMany(res, query)
	}
}
