import { BadRequestException, Injectable } from '@nestjs/common'
import { ReturningProductMVRepository } from './returning-product-mv.repository'
import { createResponse, CRequest, ERROR_MSG } from '@common'
import {
	ReturningProductMVCreateOneRequest,
	ReturningProductMVDeleteOneRequest,
	ReturningProductMVFindManyRequest,
	ReturningProductMVFindOneRequest,
	ReturningProductMVUpdateOneRequest,
} from './interfaces'

@Injectable()
export class ReturningProductMVService {
	constructor(private readonly returningProductMVRepository: ReturningProductMVRepository) {}

	async findMany(query: ReturningProductMVFindManyRequest) {
		const items = await this.returningProductMVRepository.findMany(query)
		const count = await this.returningProductMVRepository.countFindMany(query)

		const result = query.pagination ? { totalCount: count, pagesCount: Math.ceil(count / query.pageSize), pageSize: items.length, data: items } : { data: items }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ReturningProductMVFindOneRequest) {
		const item = await this.returningProductMVRepository.findOne(query)
		if (!item) throw new BadRequestException(ERROR_MSG.RETURNING.NOT_FOUND.UZ)
		return createResponse({ data: item, success: { messages: ['find one success'] } })
	}

	async createOne(request: CRequest, body: ReturningProductMVCreateOneRequest) {
		body.staffId = request.user.id
		await this.returningProductMVRepository.createOne(body)
		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(request: CRequest, query: ReturningProductMVFindOneRequest, body: ReturningProductMVUpdateOneRequest) {
		await this.returningProductMVRepository.updateOne(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ReturningProductMVDeleteOneRequest) {
		await this.returningProductMVRepository.deleteOne(query)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
