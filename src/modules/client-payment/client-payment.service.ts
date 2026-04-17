import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { ClientPaymentRepository } from './client-payment.repository'
import {
	createResponse,
	CRequest,
	currencyBriefMapFromRows,
	enrichedCalcByCurrencyForPayments,
	ERROR_MSG,
	fillCurrencyTotalsByActiveIds,
	type PaymentLikeForCalc,
	withCurrencyBriefTotalMany,
} from '@common'
import {
	ClientPaymentGetOneRequest,
	ClientPaymentCreateOneRequest,
	ClientPaymentUpdateOneRequest,
	ClientPaymentGetManyRequest,
	ClientPaymentFindManyRequest,
	ClientPaymentFindOneRequest,
	ClientPaymentDeleteOneRequest,
	ClientPaymentCalcByCurrency,
	ClientPaymentFindOneData,
} from './interfaces'
import { ClientService } from '../client'
import { CurrencyRepository } from '../currency'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { BotService } from '../bot'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class ClientPaymentService {
	private readonly clientPaymentRepository: ClientPaymentRepository
	private readonly clientService: ClientService

	constructor(
		clientPaymentRepository: ClientPaymentRepository,
		@Inject(forwardRef(() => ClientService)) clientService: ClientService,
		private readonly currencyRepository: CurrencyRepository,
		private readonly excelService: ExcelService,
		private readonly botService: BotService,
	) {
		this.clientPaymentRepository = clientPaymentRepository
		this.clientService = clientService
	}

	private netAmountsMapForPayment(p: PaymentLikeForCalc): Map<string, Decimal> {
		const m = new Map<string, Decimal>()
		for (const line of p.paymentMethods ?? p.methods ?? []) {
			m.set(line.currencyId, (m.get(line.currencyId) ?? new Decimal(0)).plus(line.amount))
		}
		for (const line of p.changeMethods ?? []) {
			m.set(line.currencyId, (m.get(line.currencyId) ?? new Decimal(0)).minus(line.amount))
		}
		return m
	}

	private mergeNetMapsForPayments(payments: PaymentLikeForCalc[]): Map<string, Decimal> {
		const out = new Map<string, Decimal>()
		for (const p of payments) {
			for (const [currencyId, amt] of this.netAmountsMapForPayment(p)) {
				out.set(currencyId, (out.get(currencyId) ?? new Decimal(0)).plus(amt))
			}
		}
		return out
	}

	private async enrichClientPaymentsFindManyData(payments: PaymentLikeForCalc[]) {
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()
		const briefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds(activeCurrencyIds))
		const totalsByCurrency = withCurrencyBriefTotalMany(fillCurrencyTotalsByActiveIds(activeCurrencyIds, this.mergeNetMapsForPayments(payments)), briefMap)
		const calcByCurrency: ClientPaymentCalcByCurrency[] = await enrichedCalcByCurrencyForPayments(payments, {
			findAllActiveIds: () => this.currencyRepository.findAllActiveIds(),
			findBriefByIds: (ids) => this.currencyRepository.findBriefByIds(ids),
		})

		const clientIds = [...new Set(payments.map((p) => (p as { client?: { id: string } }).client?.id).filter(Boolean))] as string[]
		const debtMap = await this.clientService.getDebtSnapshotsByClientIds(clientIds)

		const data = payments.map((p) => {
			const row = p as typeof p & { client?: { id: string; fullname: string; phone: string }; staff?: { id: string; fullname: string; phone: string } }
			return {
				...row,
				...(row.client
					? {
							client: { ...row.client, debtByCurrency: debtMap.get(row.client.id) ?? [] },
						}
					: {}),
				totalsByCurrency: withCurrencyBriefTotalMany(fillCurrencyTotalsByActiveIds(activeCurrencyIds, this.netAmountsMapForPayment(p)), briefMap),
			}
		})

		return { data: data as ClientPaymentFindOneData[], calcByCurrency, totalsByCurrency }
	}

	async findMany(query: ClientPaymentFindManyRequest) {
		const payments = await this.clientPaymentRepository.findMany(query)
		const paymentsCount = await this.clientPaymentRepository.countFindMany(query)
		const { data, calcByCurrency, totalsByCurrency } = await this.enrichClientPaymentsFindManyData(payments)

		const result = query.pagination
			? {
					totalCount: paymentsCount,
					pagesCount: Math.ceil(paymentsCount / query.pageSize),
					pageSize: payments.length,
					data,
					calcByCurrency,
					totalsByCurrency,
				}
			: { data, calcByCurrency, totalsByCurrency }

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
		const { data, calcByCurrency, totalsByCurrency } = await this.enrichClientPaymentsFindManyData(payments)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(paymentsCount / query.pageSize),
					pageSize: payments.length,
					data,
					calcByCurrency,
					totalsByCurrency,
				}
			: { data, calcByCurrency, totalsByCurrency }

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
