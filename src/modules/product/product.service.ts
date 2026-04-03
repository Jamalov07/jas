import { BadRequestException, Injectable } from '@nestjs/common'
import { ProductRepository } from './product.repository'
import { createResponse, ERROR_MSG } from '@common'
import { ProductGetOneRequest, ProductCreateOneRequest, ProductUpdateOneRequest, ProductGetManyRequest, ProductFindManyRequest, ProductFindOneRequest } from './interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { PriceTypeEnum } from '@prisma/client'

@Injectable()
export class ProductService {
	constructor(
		private readonly productRepository: ProductRepository,
		private readonly excelService: ExcelService,
	) {}

	async findMany(query: ProductFindManyRequest) {
		const products = await this.productRepository.findMany(query)
		const productsCount = await this.productRepository.countFindMany(query)

		const mappedProducts = products.map((p) => {
			const lastSelling = p.productMVs?.length ? p.productMVs[0] : null

			delete p.productMVs

			return {
				...p,
			lastSellingDate: lastSelling?.selling?.date ?? null,
			lastSellingPrice: lastSelling?.productMVPrices?.find((p) => p.type === 'selling')?.price ?? lastSelling?.productMVPrices?.[0]?.price ?? null,
			lastSellingCount: lastSelling?.count ?? null,
				prices: {
					cost: p.productPrices.find((pri) => pri.type === PriceTypeEnum.cost),
					selling: p.productPrices.find((pri) => pri.type === PriceTypeEnum.selling),
					wholesale: p.productPrices.find((pri) => pri.type === PriceTypeEnum.wholesale),
				},
			}
		})

		const sortedProducts = mappedProducts.sort((a, b) => {
			if (!a.lastSellingDate && !b.lastSellingDate) return 0
			if (!a.lastSellingDate) return 1
			if (!b.lastSellingDate) return -1
			return new Date(b.lastSellingDate).getTime() - new Date(a.lastSellingDate).getTime()
		})

		const result = query.pagination
			? {
					totalCount: productsCount,
					pagesCount: Math.ceil(productsCount / query.pageSize),
					pageSize: sortedProducts.length,
					data: sortedProducts,
				}
			: { data: sortedProducts }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async excelDownloadMany(res: Response, query: ProductFindManyRequest) {
		return this.excelService.productDownloadMany(res, query)
	}

	async findOne(query: ProductFindOneRequest) {
		const product = await this.productRepository.findOne(query)

		if (!product) {
			throw new BadRequestException(ERROR_MSG.PRODUCT.NOT_FOUND.UZ)
		}
		const lastSelling = product.productMVs?.length ? product.productMVs[0] : null

		const result = {
			...product,
			lastSellingDate: lastSelling.selling.date ?? null,
			lastSellingPrice: lastSelling?.productMVPrices?.find((p) => p.type === 'selling')?.price ?? lastSelling?.productMVPrices?.[0]?.price ?? null,
			lastSellingCount: lastSelling?.count ?? null,
			prices: {
				cost: product.productPrices.find((pri) => pri.type === PriceTypeEnum.cost),
				selling: product.productPrices.find((pri) => pri.type === PriceTypeEnum.selling),
				wholesale: product.productPrices.find((pri) => pri.type === PriceTypeEnum.wholesale),
			},
		}

		delete result.productMVs

		return createResponse({
			data: result,
			success: { messages: ['find one success'] },
		})
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
			for (const priceRecord of current.productPrices) {
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
}
