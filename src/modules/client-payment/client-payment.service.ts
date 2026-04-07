import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { ClientPaymentRepository } from './client-payment.repository'
import { createResponse, CRequest, ERROR_MSG } from '@common'
import {
	ClientPaymentGetOneRequest,
	ClientPaymentCreateOneRequest,
	ClientPaymentUpdateOneRequest,
	ClientPaymentGetManyRequest,
	ClientPaymentFindManyRequest,
	ClientPaymentFindOneRequest,
	ClientPaymentDeleteOneRequest,
	ClientPaymentCalcByCurrency,
} from './interfaces'
import { ClientService } from '../client'
import { Decimal } from '@prisma/client/runtime/library'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { BotService } from '../bot'

@Injectable()
export class ClientPaymentService {
	private readonly clientPaymentRepository: ClientPaymentRepository
	private readonly clientService: ClientService

	constructor(
		clientPaymentRepository: ClientPaymentRepository,
		@Inject(forwardRef(() => ClientService)) clientService: ClientService,
		private readonly excelService: ExcelService,
		private readonly botService: BotService,
	) {
		this.clientPaymentRepository = clientPaymentRepository
		this.clientService = clientService
	}

	async findMany(query: ClientPaymentFindManyRequest) {
		const payments = await this.clientPaymentRepository.findMany(query)
		const paymentsCount = await this.clientPaymentRepository.countFindMany(query)

		const calcMap = new Map<string, Decimal>()
		for (const payment of payments) {
			for (const method of payment.methods) {
				const curr = calcMap.get(method.currencyId) ?? new Decimal(0)
				calcMap.set(method.currencyId, curr.plus(method.amount))
			}
		}
		const calcByCurrency: ClientPaymentCalcByCurrency[] = Array.from(calcMap.entries()).map(([currencyId, total]) => ({ currencyId, total }))

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

	async findOne(query: ClientPaymentFindOneRequest) {
		const payment = await this.clientPaymentRepository.findOne(query)

		if (!payment) {
			throw new BadRequestException(ERROR_MSG.CLIENT_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: payment, success: { messages: ['find one success'] } })
	}

	async getMany(query: ClientPaymentGetManyRequest) {
		const payments = await this.clientPaymentRepository.getMany(query)
		const paymentsCount = await this.clientPaymentRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(paymentsCount / query.pageSize),
					pageSize: payments.length,
					data: payments,
				}
			: { data: payments }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ClientPaymentGetOneRequest) {
		const payment = await this.clientPaymentRepository.getOne(query)

		if (!payment) {
			throw new BadRequestException(ERROR_MSG.CLIENT_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: payment, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: ClientPaymentCreateOneRequest) {
		await this.clientService.getOne({ id: body.clientId })

		body = { ...body, staffId: request.user.id }

		const payment = await this.clientPaymentRepository.createOne(body)

		try {
			const clientResult = await this.clientService.findOne({ id: payment.client.id })
			await this.botService.sendClientPaymentToChannel(payment, false, clientResult.data.debtByCurrency ?? []).catch(console.log)
		} catch (e) {
			console.log('bot error:', e)
		}

		return createResponse({ data: payment, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ClientPaymentGetOneRequest, body: ClientPaymentUpdateOneRequest) {
		await this.getOne(query)

		const updatedPayment = await this.clientPaymentRepository.updateOne(query, body)

		try {
			const clientResult = await this.clientService.findOne({ id: updatedPayment.client.id })
			await this.botService.sendClientPaymentToChannel(updatedPayment, true, clientResult.data.debtByCurrency ?? []).catch(console.log)
		} catch (e) {
			console.log('bot error:', e)
		}

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ClientPaymentDeleteOneRequest) {
		const existing = await this.clientPaymentRepository.findOne({ id: query.id })
		if (!existing) {
			throw new BadRequestException(ERROR_MSG.CLIENT_PAYMENT.NOT_FOUND.UZ)
		}

		await this.clientPaymentRepository.deleteOne(query)

		try {
			const clientResult = await this.clientService.findOne({ id: existing.client.id })
			await this.botService.sendDeletedClientPaymentToChannel(existing, clientResult.data.debtByCurrency ?? []).catch(console.log)
		} catch (e) {
			console.log('bot error:', e)
		}

		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: ClientPaymentFindManyRequest) {
		return this.excelService.clientPaymentDownloadMany(res, query)
	}
}
