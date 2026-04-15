import { BadRequestException, Injectable } from '@nestjs/common'
import { StaffPaymentRepository } from './staff-payment.repository'
import { createResponse, CRequest, DeleteMethodEnum, enrichedCalcByCurrencyForPayments, ERROR_MSG } from '@common'
import {
	StaffPaymentGetOneRequest,
	StaffPaymentCreateOneRequest,
	StaffPaymentUpdateOneRequest,
	StaffPaymentGetManyRequest,
	StaffPaymentFindManyRequest,
	StaffPaymentFindOneRequest,
	StaffPaymentDeleteOneRequest,
	StaffPaymentCalcByCurrency,
} from './interfaces'
import { StaffService } from '../staff'
import { CurrencyRepository } from '../currency'
import { ExcelService } from '../shared'
import { Response } from 'express'

@Injectable()
export class StaffPaymentService {
	constructor(
		private readonly staffPaymentRepository: StaffPaymentRepository,
		private readonly staffService: StaffService,
		private readonly currencyRepository: CurrencyRepository,
		private readonly excelService: ExcelService,
	) {}

	async findMany(query: StaffPaymentFindManyRequest) {
		const payments = await this.staffPaymentRepository.findMany(query)
		const paymentsCount = await this.staffPaymentRepository.countFindMany(query)
		const calcByCurrency: StaffPaymentCalcByCurrency[] = await enrichedCalcByCurrencyForPayments(payments, {
			findAllActiveIds: () => this.currencyRepository.findAllActiveIds(),
			findBriefByIds: (ids) => this.currencyRepository.findBriefByIds(ids),
		})

		const result = query.pagination
			? {
					totalCount: paymentsCount,
					pagesCount: Math.ceil(paymentsCount / query.pageSize),
					pageSize: payments.length,
					data: payments,
					calcByCurrency,
				}
			: { data: payments, calcByCurrency }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: StaffPaymentFindOneRequest) {
		const payment = await this.staffPaymentRepository.findOne(query)

		if (!payment) {
			throw new BadRequestException(ERROR_MSG.STAFF_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: payment, success: { messages: ['find one success'] } })
	}

	async getMany(query: StaffPaymentGetManyRequest) {
		const payments = await this.staffPaymentRepository.getMany(query)
		const paymentsCount = await this.staffPaymentRepository.countGetMany(query)
		const calcByCurrency: StaffPaymentCalcByCurrency[] = await enrichedCalcByCurrencyForPayments(payments, {
			findAllActiveIds: () => this.currencyRepository.findAllActiveIds(),
			findBriefByIds: (ids) => this.currencyRepository.findBriefByIds(ids),
		})

		const result = query.pagination
			? {
					pagesCount: Math.ceil(paymentsCount / query.pageSize),
					pageSize: payments.length,
					data: payments,
					calcByCurrency,
				}
			: { data: payments, calcByCurrency }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: StaffPaymentGetOneRequest) {
		const payment = await this.staffPaymentRepository.getOne(query)

		if (!payment) {
			throw new BadRequestException(ERROR_MSG.STAFF_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: payment, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: StaffPaymentCreateOneRequest) {
		await this.staffService.getOne({ id: body.employeeId })

		const payment = await this.staffPaymentRepository.createOne({ ...body, staffId: request.user.id })

		return createResponse({ data: payment, success: { messages: ['create one success'] } })
	}

	async updateOne(query: StaffPaymentGetOneRequest, body: StaffPaymentUpdateOneRequest) {
		await this.getOne(query)

		await this.staffPaymentRepository.updateOne(query, body)

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: StaffPaymentDeleteOneRequest) {
		await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.staffPaymentRepository.deleteOne(query)
		} else {
			await this.staffPaymentRepository.updateOne(query, { deletedAt: new Date() })
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: StaffPaymentFindManyRequest) {
		return this.excelService.staffPaymentDownloadMany(res, query)
	}
}
