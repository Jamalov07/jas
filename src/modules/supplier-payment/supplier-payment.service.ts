import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { SupplierPaymentRepository } from './supplier-payment.repository'
import { createResponse, CRequest, ERROR_MSG } from '@common'
import {
	SupplierPaymentGetOneRequest,
	SupplierPaymentCreateOneRequest,
	SupplierPaymentUpdateOneRequest,
	SupplierPaymentGetManyRequest,
	SupplierPaymentFindManyRequest,
	SupplierPaymentFindOneRequest,
	SupplierPaymentDeleteOneRequest,
	SupplierPaymentCalcByCurrency,
} from './interfaces'
import { SupplierService } from '../supplier'
import { Decimal } from '@prisma/client/runtime/library'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { BotService } from '../bot'

@Injectable()
export class SupplierPaymentService {
	private readonly supplierPaymentRepository: SupplierPaymentRepository
	private readonly supplierService: SupplierService

	constructor(
		supplierPaymentRepository: SupplierPaymentRepository,
		@Inject(forwardRef(() => SupplierService)) supplierService: SupplierService,
		private readonly excelService: ExcelService,
		private readonly botService: BotService,
	) {
		this.supplierPaymentRepository = supplierPaymentRepository
		this.supplierService = supplierService
	}

	async findMany(query: SupplierPaymentFindManyRequest) {
		const payments = await this.supplierPaymentRepository.findMany(query)
		const paymentsCount = await this.supplierPaymentRepository.countFindMany(query)

		const calcMap = new Map<string, Decimal>()
		for (const payment of payments) {
			for (const method of payment.supplierPaymentMethods) {
				const curr = calcMap.get(method.currencyId) ?? new Decimal(0)
				calcMap.set(method.currencyId, curr.plus(method.amount))
			}
		}
		const calcByCurrency: SupplierPaymentCalcByCurrency[] = Array.from(calcMap.entries()).map(([currencyId, total]) => ({ currencyId, total }))

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

		const result = query.pagination
			? {
					pagesCount: Math.ceil(paymentsCount / query.pageSize),
					pageSize: payments.length,
					data: payments,
				}
			: { data: payments }

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
