import { BadRequestException, Injectable } from '@nestjs/common'
import { ActionRepository } from './action.repository'
import { ActionFindManyRequest, ActionFindOneRequest, ActionGetManyRequest, ActionGetOneRequest, ActionUpdateOneRequest } from './interfaces'
import { createResponse, ERROR_MSG } from '../../common'

@Injectable()
export class ActionService {
	private readonly actionRepository: ActionRepository
	constructor(actionRepository: ActionRepository) {
		this.actionRepository = actionRepository
	}

	async findMany(query: ActionFindManyRequest) {
		const actions = await this.actionRepository.findMany(query)
		const actionsCount = await this.actionRepository.countFindMany(query)
		const result = query.pagination
			? {
					totalCount: actionsCount,
					pagesCount: Math.ceil(actionsCount / query.pageSize),
					pageSize: actions.length,
					data: actions,
				}
			: { data: actions }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ActionFindOneRequest) {
		const action = await this.actionRepository.findOne(query)

		if (!action) {
			throw new BadRequestException(ERROR_MSG.ACTION.NOT_FOUND.UZ)
		}

		return createResponse({ data: action, success: { messages: ['find one success'] } })
	}

	async getMany(query: ActionGetManyRequest) {
		const actions = await this.actionRepository.getMany(query)
		const actionsCount = await this.actionRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(actionsCount / query.pageSize),
					pageSize: actions.length,
					data: actions,
				}
			: { data: actions }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ActionGetOneRequest) {
		const action = await this.actionRepository.getOne(query)

		if (!action) {
			throw new BadRequestException(ERROR_MSG.ACTION.NOT_FOUND.UZ)
		}

		return createResponse({ data: action, success: { messages: ['get one success'] } })
	}

	async updateOne(query: ActionGetOneRequest, body: ActionUpdateOneRequest) {
		await this.getOne(query)

		await this.actionRepository.updateOne(query, body)

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}
}
