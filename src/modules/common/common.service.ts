import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { CommonRepository } from './common.repository'
import { createResponse, ERROR_MSG } from '../../common'
import { DayCloseGetOneRequest, StaffUpdateCurrencyRequest } from './interfaces'
import { UserTypeEnum } from '@prisma/client'

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

	async updateStaffCurrency(userId: string, body: StaffUpdateCurrencyRequest) {
		const user = await this.commonRepository.getUserById(userId)

		if (!user) {
			throw new BadRequestException(ERROR_MSG.STAFF.NOT_FOUND.UZ)
		}

		if (user.type !== UserTypeEnum.staff) {
			throw new ForbiddenException(ERROR_MSG.AUTH.PERMISSION_NOT_GRANTED.UZ)
		}

		await this.commonRepository.updateStaffCurrency(userId, body.currencyId)

		return createResponse({ data: null, success: { messages: ['update staff currency success'] } })
	}
}
