import { BadRequestException, Injectable } from '@nestjs/common'
import { ProductRepository } from './product.repository'
import { createResponse, ERROR_MSG } from '@common'
import { ProductCreateOneRequest, ProductFindManyRequest, ProductFindOneRequest, ProductGetManyRequest, ProductGetOneRequest, ProductUpdateOneRequest } from './interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'
import { ExcelService } from '../shared'
import { Response } from 'express'

@Injectable()
export class ProductService {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly excelService: ExcelService,
	) {}

	async findMany(query: ProductFindManyRequest) {
		const products = await this.productRepository.findMany(query)
		const productsCount = await this.productRepository.countFindMany(query)
		const inventoryRows = await this.productRepository.findManyForInventoryCalc(query)

		const calcPage = {
			totalCost: new Decimal(0),
			totalPrice: new Decimal(0),
			totalCount: new Decimal(0),
			totalWholesale: new Decimal(0),
		}

		const calcTotal = {
			totalCost: new Decimal(0),
			totalPrice: new Decimal(0),
			totalCount: new Decimal(0),
			totalWholesale: new Decimal(0),
		}

		for (const row of inventoryRows) {
			const costTotal = row.prices.find((pr) => pr.type === PriceTypeEnum.cost)?.totalPrice ?? new Decimal(0)
			const sellingTotal = row.prices.find((pr) => pr.type === PriceTypeEnum.selling)?.totalPrice ?? new Decimal(0)
			const wholesaleTotal = row.prices.find((pr) => pr.type === PriceTypeEnum.wholesale)?.totalPrice ?? new Decimal(0)
			calcTotal.totalCost = calcTotal.totalCost.plus(costTotal)
			calcTotal.totalPrice = calcTotal.totalPrice.plus(sellingTotal)
			calcTotal.totalCount = calcTotal.totalCount.plus(row.count)
			calcTotal.totalWholesale = calcTotal.totalWholesale.plus(wholesaleTotal)
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

		for (const p of sortedProducts) {
			const costTotal = p.prices.cost?.totalPrice ?? new Decimal(0)
			const sellingTotal = p.prices.selling?.totalPrice ?? new Decimal(0)
			const wholesaleTotal = p.prices.wholesale?.totalPrice ?? new Decimal(0)

			calcPage.totalCount = calcPage.totalCount.plus(p.count)

			calcPage.totalCost = calcPage.totalCost.plus(costTotal)
			calcPage.totalPrice = calcPage.totalPrice.plus(sellingTotal)
			calcPage.totalWholesale = calcPage.totalWholesale.plus(wholesaleTotal)
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
			for (const priceRecord of current.prices) {
				const typeKey = priceRecord.type as 'cost' | 'selling' | 'wholesale'
				const priceInput = body.prices?.[typeKey]

				const newPrice = priceInput?.price !== undefined ? new Decimal(priceInput.price) : priceRecord.price
				const newTotalPrice = new Decimal(newCount).mul(newPrice)

				await this.productRepository.updateProductPrice(priceRecord.id, newPrice, newTotalPrice)
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
