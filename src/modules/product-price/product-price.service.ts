import { BadRequestException, Injectable } from '@nestjs/common'
import { ProductPriceRepository } from './product-price.repository'
import { createResponse, ERROR_MSG } from '@common'
import {
	ProductPriceCreateOneRequest,
	ProductPriceDeleteOneRequest,
	ProductPriceFindManyRequest,
	ProductPriceFindOneRequest,
	ProductPriceGetManyRequest,
	ProductPriceGetOneRequest,
	ProductPriceUpdateOneRequest,
} from './interfaces'

@Injectable()
export class ProductPriceService {
	constructor(private readonly productPriceRepository: ProductPriceRepository) {}

	async findMany(query: ProductPriceFindManyRequest) {
		const productPrices = await this.productPriceRepository.findMany(query)
		const productPricesCount = await this.productPriceRepository.countFindMany(query)

		const result = query.pagination
			? {
					totalCount: productPricesCount,
					pagesCount: Math.ceil(productPricesCount / query.pageSize),
					pageSize: productPrices.length,
					data: productPrices,
				}
			: { data: productPrices }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ProductPriceFindOneRequest) {
		const productPrice = await this.productPriceRepository.findOne(query)

		if (!productPrice) {
			throw new BadRequestException(ERROR_MSG.PRODUCT_PRICE.NOT_FOUND.UZ)
		}

		return createResponse({ data: productPrice, success: { messages: ['find one success'] } })
	}

	async getMany(query: ProductPriceGetManyRequest) {
		const productPrices = await this.productPriceRepository.getMany(query)
		const productPricesCount = await this.productPriceRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(productPricesCount / query.pageSize),
					pageSize: productPrices.length,
					data: productPrices,
				}
			: { data: productPrices }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ProductPriceGetOneRequest) {
		const productPrice = await this.productPriceRepository.getOne(query)

		if (!productPrice) {
			throw new BadRequestException(ERROR_MSG.PRODUCT_PRICE.NOT_FOUND.UZ)
		}

		return createResponse({ data: productPrice, success: { messages: ['get one success'] } })
	}

	async createOne(body: ProductPriceCreateOneRequest) {
		const candidate = await this.productPriceRepository.getOne({ productId: body.productId, type: body.type })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.PRODUCT_PRICE.TYPE_EXISTS.UZ)
		}

		await this.productPriceRepository.createOne(body)

		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ProductPriceGetOneRequest, body: ProductPriceUpdateOneRequest) {
		await this.getOne(query)

		await this.productPriceRepository.updateOne(query, body)

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ProductPriceDeleteOneRequest) {
		await this.getOne(query)

		await this.productPriceRepository.deleteOne(query)

		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
