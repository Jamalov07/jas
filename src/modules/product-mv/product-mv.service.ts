import { CRequest, ERROR_MSG } from '@common'
import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { ProductMVRepository } from './product-mv.repository'
import {
	ArrivalProductMVCreateOneRequest,
	ArrivalProductMVUpdateOneRequest,
	ProductMVDeleteOneRequest,
	ProductMVFindManyRequest,
	ProductMVFindOneRequest,
	ProductMVGetManyRequest,
	ProductMVGetOneRequest,
	ReturningProductMVCreateOneRequest,
	ReturningProductMVUpdateOneRequest,
	SellingProductMVCreateOneRequest,
	SellingProductMVUpdateOneRequest,
} from './interfaces'
import { createResponse } from '../../common'
import { BotService } from '../bot'
import { ServiceTypeEnum } from '@prisma/client'
import { ClientService } from '../client'
import { Decimal } from '@prisma/client/runtime/library'
import { ArrivalService } from '../arrival'
import { SellingService } from '../selling'
import { ReturningService } from '../returning'

@Injectable()
export class ProductMVService {
	constructor(
		private readonly productMVRepository: ProductMVRepository,
		private readonly botService: BotService,
		private readonly clientService: ClientService,
		private readonly arrivalService: ArrivalService,
		private readonly returningService: ReturningService,
		@Inject(forwardRef(() => SellingService)) private readonly sellingService: SellingService,
	) {}

	async findMany(query: ProductMVFindManyRequest) {
		const products = await this.productMVRepository.findMany(query)
		const productsCount = await this.productMVRepository.countFindMany(query)

		const result = query.pagination
			? {
					totalCount: productsCount,
					pagesCount: Math.ceil(productsCount / query.pageSize),
					pageSize: products.length,
					data: products,
				}
			: { data: products }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findManyProductStats(query: ProductMVFindManyRequest) {
		const products = await this.productMVRepository.findManyForStats(query)

		let actualCount = new Decimal(0)
		let totalSellingCount = new Decimal(0)
		let totalArrivalCount = new Decimal(0)
		let totalReturningCount = new Decimal(0)

		for (const product of products) {
			if (product.type === ServiceTypeEnum.selling) {
				actualCount = actualCount.minus(product.count)
				totalSellingCount = totalSellingCount.plus(product.count)
			}
			if (product.type === ServiceTypeEnum.arrival) {
				actualCount = actualCount.plus(product.count)
				totalArrivalCount = totalArrivalCount.plus(product.count)
			}
			if (product.type === ServiceTypeEnum.returning) {
				actualCount = actualCount.plus(product.count)
				totalReturningCount = totalReturningCount.plus(product.count)
			}
		}
		return createResponse({
			data: { products: products, actualCount: actualCount, totalSellingCount: totalSellingCount, totalArrivalCount: totalArrivalCount, totalReturningCount: totalReturningCount },
			success: { messages: ['find many success'] },
		})
	}

	async findOne(query: ProductMVFindOneRequest) {
		const product = await this.productMVRepository.findOne(query)

		if (!product) {
			throw new BadRequestException(ERROR_MSG.PRODUCT_MV.NOT_FOUND.UZ)
		}

		return createResponse({
			data: product,
			success: { messages: ['find one success'] },
		})
	}

	async getMany(query: ProductMVGetManyRequest) {
		const products = await this.productMVRepository.getMany(query)
		const productsCount = await this.productMVRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(productsCount / query.pageSize),
					pageSize: products.length,
					data: products,
				}
			: { data: products }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ProductMVGetOneRequest) {
		const product = await this.productMVRepository.getOne(query)

		if (!product) {
			throw new BadRequestException(ERROR_MSG.PRODUCT_MV.NOT_FOUND.UZ)
		}

		return createResponse({ data: product, success: { messages: ['get one success'] } })
	}

	async createOneSelling(request: CRequest, body: SellingProductMVCreateOneRequest) {
		await this.productMVRepository.createOneSelling({
			...body,
			staffId: request.user.id,
		})

		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async createOneArrival(request: CRequest, body: ArrivalProductMVCreateOneRequest) {
		await this.productMVRepository.createOneArrival({
			...body,
			staffId: request.user.id,
		})

		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async createOneReturning(request: CRequest, body: ReturningProductMVCreateOneRequest) {
		await this.productMVRepository.createOneReturning({
			...body,
			staffId: request.user.id,
		})

		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOneSelling(query: ProductMVGetOneRequest, body: SellingProductMVUpdateOneRequest) {
		await this.productMVRepository.updateOneSelling(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async updateOneArrival(query: ProductMVGetOneRequest, body: ArrivalProductMVUpdateOneRequest) {
		await this.productMVRepository.updateOneArrival(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async updateOneReturning(query: ProductMVGetOneRequest, body: ReturningProductMVUpdateOneRequest) {
		await this.productMVRepository.updateOneReturning(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ProductMVDeleteOneRequest) {
		await this.productMVRepository.deleteOne(query)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
