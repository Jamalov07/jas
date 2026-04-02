import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { ClientPaymentRepository } from './client-payment.repository'
import { createResponse, CRequest, DeleteMethodEnum, ERROR_MSG } from '@common'
import {
	ClientPaymentGetOneRequest,
	ClientPaymentCreateOneRequest,
	ClientPaymentUpdateOneRequest,
	ClientPaymentGetManyRequest,
	ClientPaymentFindManyRequest,
	ClientPaymentFindOneRequest,
	ClientPaymentDeleteOneRequest,
} from './interfaces'
import { ClientService } from '../client'
import { Decimal } from '@prisma/client/runtime/library'
import { ServiceTypeEnum } from '@prisma/client'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { BotService } from '../bot'

@Injectable()
export class ClientPaymentService {
	private readonly clientPaymentRepository: ClientPaymentRepository
	private readonly clientService: ClientService
	private readonly excelService: ExcelService
	private readonly botService: BotService

	constructor(
		clientPaymentRepository: ClientPaymentRepository,
		@Inject(forwardRef(() => ClientService)) clientService: ClientService,
		excelService: ExcelService,
		botService: BotService,
	) {
		this.clientPaymentRepository = clientPaymentRepository
		this.clientService = clientService
		this.excelService = excelService
		this.botService = botService
	}

	async findMany(query: ClientPaymentFindManyRequest) {
		const clientPayments = await this.clientPaymentRepository.findMany(query)
		const clientPaymentsCount = await this.clientPaymentRepository.countFindMany(query)

		const calc = {
			totalCard: new Decimal(0),
			totalCash: new Decimal(0),
			totalOther: new Decimal(0),
			totalTransfer: new Decimal(0),
		}

		for (const payment of clientPayments) {
			calc.totalCard = calc.totalCard.plus(payment.card)
			calc.totalCash = calc.totalCash.plus(payment.cash)
			calc.totalOther = calc.totalOther.plus(payment.other)
			calc.totalTransfer = calc.totalTransfer.plus(payment.transfer)
		}

		const result = query.pagination
			? {
					totalCount: clientPaymentsCount,
					pagesCount: Math.ceil(clientPaymentsCount / query.pageSize),
					pageSize: clientPayments.length,
					data: clientPayments,
					calc: calc,
				}
			: { data: clientPayments, calc: calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async excelDownloadMany(res: Response, query: ClientPaymentFindManyRequest) {
		return this.excelService.clientPaymentDownloadMany(res, query)
	}

	async findOne(query: ClientPaymentFindOneRequest) {
		const clientPayment = await this.clientPaymentRepository.findOne(query)

		if (!clientPayment) {
			throw new BadRequestException(ERROR_MSG.CLIENT_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: { ...clientPayment }, success: { messages: ['find one success'] } })
	}

	async getMany(query: ClientPaymentGetManyRequest) {
		const clientPayments = await this.clientPaymentRepository.getMany(query)
		const clientPaymentsCount = await this.clientPaymentRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(clientPaymentsCount / query.pageSize),
					pageSize: clientPayments.length,
					data: clientPayments,
				}
			: { data: clientPayments }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ClientPaymentGetOneRequest) {
		const clientPayment = await this.clientPaymentRepository.getOne(query)

		if (!clientPayment) {
			throw new BadRequestException(ERROR_MSG.CLIENT_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: clientPayment, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: ClientPaymentCreateOneRequest) {
		await this.clientService.findOne({ id: body.userId })

		const total = new Decimal(body.card ?? 0)
			.plus(body.cash ?? 0)
			.plus(body.other ?? 0)
			.plus(body.transfer ?? 0)

		body = { ...body, staffId: request.user.id, total: total }

		const clientPayment = await this.clientPaymentRepository.createOne(body)

		if (!total.isZero()) {
			await this.clientService.updateOne({ id: body.userId }, { balance: clientPayment.user.balance.minus(total) })
		}

		const client = await this.clientService.findOne({ id: clientPayment.user.id })

		await this.botService.sendPaymentToChannel(clientPayment, false, client.data)

		return createResponse({ data: clientPayment, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ClientPaymentGetOneRequest, body: ClientPaymentUpdateOneRequest) {
		const payment = await this.getOne(query)

		const newTotal = new Decimal(body.card ?? 0)
			.plus(body.cash ?? 0)
			.plus(body.other ?? 0)
			.plus(body.transfer ?? 0)

		const totalDiff = newTotal.minus(payment.data.total)

		body = {
			...body,
			total: !totalDiff.isZero() ? newTotal : undefined,
		}

		const clientPayment = await this.clientPaymentRepository.updateOne(query, body)

		if (!totalDiff.isZero()) {
			await this.clientService.updateOne({ id: payment.data.user.id }, { balance: payment.data.user.balance.minus(totalDiff) })
		}

		const client = await this.clientService.findOne({ id: clientPayment.user.id })

		await this.botService.sendPaymentToChannel(clientPayment, true, client.data)

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ClientPaymentDeleteOneRequest) {
		const payment = await this.getOne(query)
		if (payment.data.type === ServiceTypeEnum.selling) {
			await this.clientPaymentRepository.updateOne(query, {
				total: new Decimal(0),
				card: new Decimal(0),
				cash: new Decimal(0),
				other: new Decimal(0),
				transfer: new Decimal(0),
				description: '',
			})
		} else {
			// if (query.method === DeleteMethodEnum.hard) {
			if (!payment.data.total.isZero()) {
				await this.clientService.updateOne({ id: payment.data.user.id }, { balance: payment.data.user.balance.plus(payment.data.total) })
			}
			await this.clientPaymentRepository.deleteOne(query)
			// } else {
			// 	await this.clientPaymentRepository.updateOne(query, { deletedAt: new Date() })
			// }
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
