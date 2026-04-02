import { BadRequestException, Injectable } from '@nestjs/common'
import { StaffPaymentRepository } from './staff-payment.repository'
import { createResponse, CRequest, DeleteMethodEnum, ERROR_MSG } from '@common'
import {
	StaffPaymentGetOneRequest,
	StaffPaymentCreateOneRequest,
	StaffPaymentUpdateOneRequest,
	StaffPaymentGetManyRequest,
	StaffPaymentFindManyRequest,
	StaffPaymentFindOneRequest,
	StaffPaymentDeleteOneRequest,
} from './interfaces'
import { StaffService } from '../staff'
import { Decimal } from '@prisma/client/runtime/library'
import { ExcelService } from '../shared'
import { Response } from 'express'

@Injectable()
export class StaffPaymentService {
	constructor(
		private readonly staffPaymentRepository: StaffPaymentRepository,
		private readonly staffService: StaffService,
		private readonly excelService: ExcelService,
	) {}

	async findMany(query: StaffPaymentFindManyRequest) {
		const staffPayments = await this.staffPaymentRepository.findMany(query)
		const staffPaymentsCount = await this.staffPaymentRepository.countFindMany(query)

		const calc = {
			sum: new Decimal(0),
		}

		for (const payment of staffPayments) {
			calc.sum = calc.sum.plus(payment.sum)
		}

		const result = query.pagination
			? {
					totalCount: staffPaymentsCount,
					pagesCount: Math.ceil(staffPaymentsCount / query.pageSize),
					pageSize: staffPayments.length,
					data: staffPayments,
					calc: calc,
				}
			: { data: staffPayments, calc: calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async excelDownloadMany(res: Response, query: StaffPaymentFindManyRequest) {
		return this.excelService.staffPaymentDownloadMany(res, query)
	}

	async findOne(query: StaffPaymentFindOneRequest) {
		const staffPayment = await this.staffPaymentRepository.findOne(query)

		if (!staffPayment) {
			throw new BadRequestException(ERROR_MSG.STAFF_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: { ...staffPayment }, success: { messages: ['find one success'] } })
	}

	async getMany(query: StaffPaymentGetManyRequest) {
		const staffPayments = await this.staffPaymentRepository.getMany(query)
		const staffPaymentsCount = await this.staffPaymentRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(staffPaymentsCount / query.pageSize),
					pageSize: staffPayments.length,
					data: staffPayments,
				}
			: { data: staffPayments }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: StaffPaymentGetOneRequest) {
		const staffPayment = await this.staffPaymentRepository.getOne(query)

		if (!staffPayment) {
			throw new BadRequestException(ERROR_MSG.STAFF_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: staffPayment, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: StaffPaymentCreateOneRequest) {
		const payment = await this.staffService.findOne({ id: body.userId })

		const staffPayment = await this.staffPaymentRepository.createOne({ ...body, staffId: request.user.id })

		if (!body.sum) {
			await this.staffService.updateOne({ id: staffPayment.user.id }, { balance: staffPayment.user.balance.plus(staffPayment.sum) })
		}

		return createResponse({ data: staffPayment, success: { messages: ['create one success'] } })
	}

	async updateOne(query: StaffPaymentGetOneRequest, body: StaffPaymentUpdateOneRequest) {
		const payment = await this.getOne(query)

		const hasPaymentFields = body.sum !== undefined

		let sumDiff = new Decimal(0)

		if (hasPaymentFields) {
			const oldSum = new Decimal(payment.data.sum ?? 0)
			const newSum = new Decimal(body.sum ?? 0)
			sumDiff = newSum.minus(oldSum)
		}

		await this.staffPaymentRepository.updateOne(query, { ...body })

		if (!sumDiff.isZero()) {
			await this.staffService.updateOne({ id: payment.data.user.id }, { balance: payment.data.user.balance.minus(sumDiff) })
		}

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: StaffPaymentDeleteOneRequest) {
		const payment = await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			if (!payment.data.total.isZero()) {
				await this.staffService.updateOne({ id: payment.data.user.id }, { balance: payment.data.user.balance.minus(payment.data.total) })
			}
			await this.staffPaymentRepository.deleteOne(query)
		} else {
			await this.staffPaymentRepository.updateOne(query, { deletedAt: new Date() })
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
