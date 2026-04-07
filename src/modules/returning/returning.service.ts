import { BadRequestException, Injectable } from '@nestjs/common'
import { ReturningRepository } from './returning.repository'
import { createResponse, CRequest, DeleteMethodEnum, ERROR_MSG } from '@common'
import {
	ReturningGetOneRequest,
	ReturningCreateOneRequest,
	ReturningUpdateOneRequest,
	ReturningGetManyRequest,
	ReturningFindManyRequest,
	ReturningFindOneRequest,
	ReturningDeleteOneRequest,
} from './interfaces'
import { SellingStatusEnum } from '@prisma/client'
import { CommonService } from '../common'
import { ExcelService } from '../shared'
import { Response } from 'express'

@Injectable()
export class ReturningService {
	constructor(
		private readonly returningRepository: ReturningRepository,
		private readonly commonService: CommonService,
		private readonly excelService: ExcelService,
	) {}

	async findMany(query: ReturningFindManyRequest) {
		const returnings = await this.returningRepository.findMany(query)
		const returningsCount = await this.returningRepository.countFindMany(query)

		const mappedReturnings = returnings.map((returning) => ({
			...returning,
			payment: returning.payment,
		}))

		const result = query.pagination
			? { totalCount: returningsCount, pagesCount: Math.ceil(returningsCount / query.pageSize), pageSize: mappedReturnings.length, data: mappedReturnings }
			: { data: mappedReturnings }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ReturningFindOneRequest) {
		const returning = await this.returningRepository.findOne(query)

		if (!returning) {
			throw new BadRequestException(ERROR_MSG.RETURNING.NOT_FOUND.UZ)
		}

		return createResponse({ data: { ...returning, payment: returning.payment }, success: { messages: ['find one success'] } })
	}

	async getMany(query: ReturningGetManyRequest) {
		const returnings = await this.returningRepository.getMany(query)
		const returningsCount = await this.returningRepository.countGetMany(query)

		const result = query.pagination ? { pagesCount: Math.ceil(returningsCount / query.pageSize), pageSize: returnings.length, data: returnings } : { data: returnings }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ReturningGetOneRequest) {
		const returning = await this.returningRepository.getOne(query)

		if (!returning) {
			throw new BadRequestException(ERROR_MSG.RETURNING.NOT_FOUND.UZ)
		}

		return createResponse({ data: returning, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: ReturningCreateOneRequest) {
		if (body.payment?.paymentMethods?.length) {
			body.status = SellingStatusEnum.accepted
		}

		if (body.status === SellingStatusEnum.accepted) {
			const dayClose = await this.commonService.getDayClose({})
			if (dayClose.data.isClosed) {
				const tomorrow = new Date()
				tomorrow.setDate(tomorrow.getDate() + 1)
				tomorrow.setHours(0, 0, 0, 0)
				body.date = tomorrow
			} else {
				body.date = new Date()
			}
		} else if (body.date) {
			const inputDate = new Date(body.date)
			const now = new Date()
			const isToday = inputDate.getFullYear() === now.getFullYear() && inputDate.getMonth() === now.getMonth() && inputDate.getDate() === now.getDate()
			body.date = isToday ? now : new Date(inputDate.setHours(0, 0, 0, 0))
		}

		body.staffId = request.user.id
		const returning = await this.returningRepository.createOne(body)
		return createResponse({ data: returning, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ReturningGetOneRequest, body: ReturningUpdateOneRequest) {
		const existing = await this.getOne(query)

		if (existing.data.status === SellingStatusEnum.accepted) {
			body.productIdsToRemove = []
			body.products = []
		}

		if (body.status === SellingStatusEnum.accepted && existing.data.status !== SellingStatusEnum.accepted) {
			body.date = new Date()
		}

		await this.returningRepository.updateOne(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ReturningDeleteOneRequest) {
		await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.returningRepository.deleteOne(query)
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: ReturningFindManyRequest) {
		return this.excelService.returningDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: ReturningFindOneRequest) {
		return this.excelService.returningDownloadOne(res, query)
	}
}
