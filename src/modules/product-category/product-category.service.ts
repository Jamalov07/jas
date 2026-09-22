import { BadRequestException, Injectable } from '@nestjs/common'
import { createResponse, ERROR_MSG } from '@common'
import { ProductCategoryRepository } from './product-category.repository'
import {
	ProductCategoryCreateOneRequest,
	ProductCategoryDeleteOneRequest,
	ProductCategoryFindManyRequest,
	ProductCategoryFindOneRequest,
	ProductCategoryUpdateOneRequest,
} from './interfaces'

@Injectable()
export class ProductCategoryService {
	constructor(private readonly productCategoryRepository: ProductCategoryRepository) {}

	async findMany(query: ProductCategoryFindManyRequest) {
		const categories = await this.productCategoryRepository.findMany(query)
		const categoriesCount = await this.productCategoryRepository.countFindMany(query)

		const result = query.pagination
			? {
					totalCount: categoriesCount,
					pagesCount: Math.ceil(categoriesCount / query.pageSize),
					pageSize: categories.length,
					data: categories,
				}
			: { data: categories }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ProductCategoryFindOneRequest) {
		const category = await this.productCategoryRepository.findOne(query)
		if (!category) {
			throw new BadRequestException(ERROR_MSG.PRODUCT_CATEGORY.NOT_FOUND.UZ)
		}
		return createResponse({ data: category, success: { messages: ['find one success'] } })
	}

	async createOne(body: ProductCategoryCreateOneRequest) {
		const candidate = await this.productCategoryRepository.getOne({ name: body.name })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.PRODUCT_CATEGORY.NAME_EXISTS.UZ)
		}
		await this.productCategoryRepository.createOne(body)
		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ProductCategoryFindOneRequest, body: ProductCategoryUpdateOneRequest) {
		await this.findOne(query)
		if (body.name) {
			const candidate = await this.productCategoryRepository.getOne({ name: body.name })
			if (candidate && candidate.id !== query.id) {
				throw new BadRequestException(ERROR_MSG.PRODUCT_CATEGORY.NAME_EXISTS.UZ)
			}
		}
		await this.productCategoryRepository.updateOne(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ProductCategoryDeleteOneRequest) {
		await this.findOne(query)
		await this.productCategoryRepository.deleteOne(query)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
