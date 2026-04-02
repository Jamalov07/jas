import { BadRequestException, Injectable } from '@nestjs/common'
import { CommonRepository } from './common.repository'
import { createResponse, ERROR_MSG } from '../../common'
import { DayCloseGetOneRequest } from './interfaces'

@Injectable()
export class CommonService {
	private readonly commonRepository: CommonRepository
	constructor(commonRepository: CommonRepository) {
		this.commonRepository = commonRepository
	}

	async createDayClose() {
		const dayClose = await this.commonRepository.getDayClose({ closedDate: new Date() })

		if (dayClose.isClosed) {
			throw new BadRequestException(ERROR_MSG.DAY_CLOSE.CLOSED.UZ)
		}

		await this.commonRepository.createDayClose()

		return createResponse({ data: null, success: { messages: ['create day close success'] } })
	}

	async getDayClose(query: DayCloseGetOneRequest) {
		const dayClose = await this.commonRepository.getDayClose(query)

		return createResponse({ data: dayClose, success: { messages: ['get day close success'] } })
	}
}
