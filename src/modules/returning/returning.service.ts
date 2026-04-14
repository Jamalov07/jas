import { BadRequestException, Injectable } from '@nestjs/common'
import { ReturningRepository } from './returning.repository'
import {
	createResponse,
	CRequest,
	currencyBriefMapFromRows,
	DeleteMethodEnum,
	ERROR_MSG,
	fillPaymentMethodCurrencyTotalsByActiveIds,
	withCurrencyBriefAmountMany,
} from '@common'
import {
	ReturningGetOneRequest,
	ReturningCreateOneRequest,
	ReturningUpdateOneRequest,
	ReturningGetManyRequest,
	ReturningFindManyRequest,
	ReturningFindOneRequest,
	ReturningDeleteOneRequest,
	ReturningPaymentData,
	ReturningCalcEntry,
} from './interfaces'
import { SellingStatusEnum } from '@prisma/client'
import { CommonService } from '../common'
import { CurrencyRepository } from '../currency'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class ReturningService {
	constructor(
		private readonly returningRepository: ReturningRepository,
		private readonly commonService: CommonService,
		private readonly currencyRepository: CurrencyRepository,
		private readonly excelService: ExcelService,
	) {}

	private calcTotalPricesFromProducts(products: { prices: { type: string; currencyId: string; totalPrice: Decimal; currency?: { symbol: string } }[] }[]) {
		const map = new Map<string, { total: Decimal; currency?: { symbol: string } }>()
		for (const product of products) {
			for (const price of product.prices) {
				if (price.type === 'selling') {
					const existing = map.get(price.currencyId) ?? { total: new Decimal(0), currency: price.currency }
					map.set(price.currencyId, { total: existing.total.plus(price.totalPrice), currency: existing.currency || price.currency })
				}
			}
		}
		return Array.from(map.entries()).map(([currencyId, { total, currency }]) => ({ currencyId, total, currency }))
	}

	private buildPaymentData(
		csp: { id: string; description?: string | null; createdAt: Date; methods: { type: string; currencyId: string; amount: Decimal }[] } | null | undefined,
	): ReturningPaymentData | undefined {
		if (!csp) return undefined
		return {
			id: csp.id,
			description: csp.description,
			paymentMethods: csp.methods as any,
			createdAt: csp.createdAt,
		}
	}

	private calcPaymentTotal(csp: { methods: { amount: Decimal }[] } | null | undefined): Decimal {
		return csp?.methods?.reduce((acc, m) => acc.plus(m.amount), new Decimal(0)) ?? new Decimal(0)
	}

	/** findOne response: prices as { selling: {...}, ... } instead of array */
	private pricesArrayToByTypeRecord(prices: { type: string }[]): Record<string, unknown> {
		const out: Record<string, unknown> = {}
		for (const price of prices) {
			const { type, ...rest } = price as { type: string } & Record<string, unknown>
			if (!(type in out)) {
				out[type] = rest
			} else {
				const ex = out[type]
				out[type] = Array.isArray(ex) ? [...ex, rest] : [ex, rest]
			}
		}
		return out
	}

	private mapProductsPricesToByType<T extends { prices: { type: string }[] }>(products: T[]) {
		return products.map((p) => ({ ...p, prices: this.pricesArrayToByTypeRecord(p.prices) }))
	}

	private calcDebtByCurrency(totalPrices: { currencyId: string; total: Decimal; currency?: { symbol: string } }[], payment: ReturningPaymentData | undefined) {
		const debtMap = new Map<string, { amount: Decimal; symbol?: string }>()

		for (const tp of totalPrices) {
			debtMap.set(tp.currencyId, { amount: tp.total, symbol: tp.currency?.symbol })
		}

		// All payment types (cash, fromCash, fromBalance) settle the returning obligation
		for (const method of (payment?.paymentMethods as any[]) ?? []) {
			const existing = debtMap.get(method.currencyId)
			const symbol = existing?.symbol ?? method.currency?.symbol
			debtMap.set(method.currencyId, { amount: (existing?.amount ?? new Decimal(0)).minus(method.amount), symbol })
		}

		return Array.from(debtMap.entries()).map(([currencyId, { amount }]) => ({ currencyId, amount }))
	}

	async findMany(query: ReturningFindManyRequest) {
		const returnings = await this.returningRepository.findMany(query)
		const returningsCount = await this.returningRepository.countFindMany(query)
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()

		const calcMap = new Map<string, Decimal>()
		const mappedReturnings = returnings.map((returning) => {
			for (const method of returning.payment?.methods ?? []) {
				const key = `${method.type}_${method.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(method.amount))
			}

			const totalPrices = this.calcTotalPricesFromProducts(returning.products)
			const payment = this.buildPaymentData(returning.payment)
			const debtByCurrency = this.calcDebtByCurrency(totalPrices, payment)

			return { ...returning, payment, totalPrices, debtByCurrency }
		})

		const calc: ReturningCalcEntry[] = fillPaymentMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)

		const debtCurrencyIds = new Set<string>()
		for (const r of mappedReturnings) {
			for (const d of r.debtByCurrency) debtCurrencyIds.add(d.currencyId)
		}
		const debtCurrencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...debtCurrencyIds]))
		const returningsWithDebtCurrency = mappedReturnings.map((r) => ({
			...r,
			debtByCurrency: withCurrencyBriefAmountMany(r.debtByCurrency, debtCurrencyMap),
		}))

		const result = query.pagination
			? {
					totalCount: returningsCount,
					pagesCount: Math.ceil(returningsCount / query.pageSize),
					pageSize: returningsWithDebtCurrency.length,
					data: returningsWithDebtCurrency,
					calc,
				}
			: { data: returningsWithDebtCurrency, calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ReturningFindOneRequest) {
		const returning = await this.returningRepository.findOne(query)

		if (!returning) {
			throw new BadRequestException(ERROR_MSG.RETURNING.NOT_FOUND.UZ)
		}

		const products = this.mapProductsPricesToByType(returning.products)
		return createResponse({ data: { ...returning, products, payment: returning.payment }, success: { messages: ['find one success'] } })
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
