import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { SupplierPaymentRepository } from './supplier-payment.repository'
import {
	createResponse,
	CRequest,
	currencyBriefMapFromRows,
	enrichedCalcByCurrencyForPayments,
	ERROR_MSG,
	fillCurrencyTotalsByActiveIds,
	type PaymentLikeForCalc,
	resolvePaymentColumnCurrencyIds,
	withCurrencyBriefTotalMany,
} from '@common'
import {
	SupplierPaymentGetOneRequest,
	SupplierPaymentCreateOneRequest,
	SupplierPaymentUpdateOneRequest,
	SupplierPaymentGetManyRequest,
	SupplierPaymentFindManyRequest,
	SupplierPaymentFindOneRequest,
	SupplierPaymentDeleteOneRequest,
	SupplierPaymentCalcByCurrency,
	SupplierPaymentFindOneData,
} from './interfaces'
import { SupplierService } from '../supplier'
import { CurrencyRepository } from '../currency'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { BotService } from '../bot'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class SupplierPaymentService {
	private readonly supplierPaymentRepository: SupplierPaymentRepository
	private readonly supplierService: SupplierService

	constructor(
		supplierPaymentRepository: SupplierPaymentRepository,
		@Inject(forwardRef(() => SupplierService)) supplierService: SupplierService,
		private readonly currencyRepository: CurrencyRepository,
		private readonly excelService: ExcelService,
		private readonly botService: BotService,
	) {
		this.supplierPaymentRepository = supplierPaymentRepository
		this.supplierService = supplierService
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

	private async enrichSupplierPaymentsFindManyData(payments: PaymentLikeForCalc[]) {
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()
		const listColumnIds = resolvePaymentColumnCurrencyIds(activeCurrencyIds, payments)
		const briefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds(listColumnIds))
		const totalsByCurrency = withCurrencyBriefTotalMany(fillCurrencyTotalsByActiveIds(listColumnIds, this.mergeNetMapsForPayments(payments)), briefMap)
		const calcByCurrency: SupplierPaymentCalcByCurrency[] = await enrichedCalcByCurrencyForPayments(payments, {
			findAllActiveIds: () => this.currencyRepository.findAllActiveIds(),
			findBriefByIds: (ids) => this.currencyRepository.findBriefByIds(ids),
		})

		const supplierIds = [...new Set(payments.map((p) => (p as { supplier?: { id: string } }).supplier?.id).filter(Boolean))] as string[]
		const debtMap = await this.supplierService.getDebtSnapshotsBySupplierIds(supplierIds)

		const data = payments.map((p) => {
			const row = p as typeof p & { supplier?: { id: string; fullname: string; phone: string }; staff?: { id: string; fullname: string; phone: string } }
			const rowColumnIds = resolvePaymentColumnCurrencyIds(activeCurrencyIds, [p])
			return {
				...row,
				...(row.supplier
					? {
							supplier: { ...row.supplier, debtByCurrency: debtMap.get(row.supplier.id) ?? [] },
						}
					: {}),
				totalsByCurrency: withCurrencyBriefTotalMany(fillCurrencyTotalsByActiveIds(rowColumnIds, this.netAmountsMapForPayment(p)), briefMap),
			}
		})

		return { data: data as SupplierPaymentFindOneData[], calcByCurrency, totalsByCurrency }
	}

	async findMany(query: SupplierPaymentFindManyRequest) {
		const payments = await this.supplierPaymentRepository.findMany(query)
		const paymentsCount = await this.supplierPaymentRepository.countFindMany(query)
		const { data, calcByCurrency, totalsByCurrency } = await this.enrichSupplierPaymentsFindManyData(payments as PaymentLikeForCalc[])

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

	async findOne(query: SupplierPaymentFindOneRequest) {
		const payment = await this.supplierPaymentRepository.findOne(query)

		if (!payment) {
			throw new BadRequestException(ERROR_MSG.SUPPLIER_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: payment, success: { messages: ['find one success'] } })
	}

	async getMany(query: SupplierPaymentGetManyRequest) {
		const payments = await this.supplierPaymentRepository.getMany(query)
		const paymentsCount = await this.supplierPaymentRepository.countGetMany(query)
		const { data, calcByCurrency, totalsByCurrency } = await this.enrichSupplierPaymentsFindManyData(payments)

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

	async getOne(query: SupplierPaymentGetOneRequest) {
		const payment = await this.supplierPaymentRepository.getOne(query)

		if (!payment) {
			throw new BadRequestException(ERROR_MSG.SUPPLIER_PAYMENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: payment, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: SupplierPaymentCreateOneRequest) {
		await this.supplierService.getOne({ id: body.supplierId })

		const payment = await this.supplierPaymentRepository.createOne({ ...body, staffId: request.user.id })

		try {
			const supplierResult = await this.supplierService.findOne({ id: payment.supplier.id })
			await this.botService.sendSupplierPaymentToChannel(payment, false, supplierResult.data.debtByCurrency ?? []).catch(console.log)
		} catch (e) {
			console.log('bot error:', e)
		}

		return createResponse({ data: payment, success: { messages: ['create one success'] } })
	}

	async updateOne(query: SupplierPaymentGetOneRequest, body: SupplierPaymentUpdateOneRequest) {
		await this.getOne(query)

		const updatedPayment = await this.supplierPaymentRepository.updateOne(query, body)

		try {
			const supplierResult = await this.supplierService.findOne({ id: updatedPayment.supplier.id })
			await this.botService.sendSupplierPaymentToChannel(updatedPayment, true, supplierResult.data.debtByCurrency ?? []).catch(console.log)
		} catch (e) {
			console.log('bot error:', e)
		}

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: SupplierPaymentDeleteOneRequest) {
		const existing = await this.supplierPaymentRepository.findOne({ id: query.id })
		if (!existing) {
			throw new BadRequestException(ERROR_MSG.SUPPLIER_PAYMENT.NOT_FOUND.UZ)
		}

		await this.supplierPaymentRepository.deleteOne(query)

		try {
			const supplierResult = await this.supplierService.findOne({ id: existing.supplier.id })
			await this.botService.sendDeletedSupplierPaymentToChannel(existing, supplierResult.data.debtByCurrency ?? []).catch(console.log)
		} catch (e) {
			console.log('bot error:', e)
		}

		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: SupplierPaymentFindManyRequest) {
		return this.excelService.supplierPaymentDownloadMany(res, query)
	}
}
