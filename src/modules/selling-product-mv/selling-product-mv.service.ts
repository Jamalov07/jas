import { BadRequestException, Injectable } from '@nestjs/common'
import { SellingProductMVRepository } from './selling-product-mv.repository'
import { createResponse, CRequest, ERROR_MSG } from '@common'
import {
	SellingProductMVCreateOneRequest,
	SellingProductMVDeleteOneRequest,
	SellingProductMVFindManyRequest,
	SellingProductMVFindOneRequest,
	SellingProductMVUpdateOneRequest,
} from './interfaces'

@Injectable()
export class SellingProductMVService {
	constructor(private readonly sellingProductMVRepository: SellingProductMVRepository) {}

	async findMany(query: SellingProductMVFindManyRequest) {
		const items = await this.sellingProductMVRepository.findMany(query)
		const count = await this.sellingProductMVRepository.countFindMany(query)

		const result = query.pagination ? { totalCount: count, pagesCount: Math.ceil(count / query.pageSize), pageSize: items.length, data: items } : { data: items }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: SellingProductMVFindOneRequest) {
		const item = await this.sellingProductMVRepository.findOne(query)
		if (!item) throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		return createResponse({ data: item, success: { messages: ['find one success'] } })
	}

	async createOne(request: CRequest, body: SellingProductMVCreateOneRequest) {
		body.staffId = request.user.id
		await this.sellingProductMVRepository.createOne(body)
		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(request: CRequest, query: SellingProductMVFindOneRequest, body: SellingProductMVUpdateOneRequest) {
		await this.sellingProductMVRepository.updateOne(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: SellingProductMVDeleteOneRequest) {
		await this.sellingProductMVRepository.deleteOne(query)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
