import { BadRequestException, Injectable } from '@nestjs/common'
import { ArrivalProductMVRepository } from './arrival-product-mv.repository'
import { createResponse, CRequest, ERROR_MSG } from '@common'
import {
	ArrivalProductMVCreateOneRequest,
	ArrivalProductMVDeleteOneRequest,
	ArrivalProductMVFindManyRequest,
	ArrivalProductMVFindOneRequest,
	ArrivalProductMVUpdateOneRequest,
} from './interfaces'

@Injectable()
export class ArrivalProductMVService {
	constructor(private readonly arrivalProductMVRepository: ArrivalProductMVRepository) {}

	async findMany(query: ArrivalProductMVFindManyRequest) {
		const items = await this.arrivalProductMVRepository.findMany(query)
		const count = await this.arrivalProductMVRepository.countFindMany(query)

		const result = query.pagination ? { totalCount: count, pagesCount: Math.ceil(count / query.pageSize), pageSize: items.length, data: items } : { data: items }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ArrivalProductMVFindOneRequest) {
		const item = await this.arrivalProductMVRepository.findOne(query)
		if (!item) throw new BadRequestException(ERROR_MSG.ARRIVAL.NOT_FOUND.UZ)
		return createResponse({ data: item, success: { messages: ['find one success'] } })
	}

	async createOne(request: CRequest, body: ArrivalProductMVCreateOneRequest) {
		body.staffId = request.user.id
		await this.arrivalProductMVRepository.createOne(body)
		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(request: CRequest, query: ArrivalProductMVFindOneRequest, body: ArrivalProductMVUpdateOneRequest) {
		await this.arrivalProductMVRepository.updateOne(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ArrivalProductMVDeleteOneRequest) {
		await this.arrivalProductMVRepository.deleteOne(query)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
