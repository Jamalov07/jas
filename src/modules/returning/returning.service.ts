import { BadRequestException, Injectable } from '@nestjs/common'
import { ReturningRepository } from './returning.repository'
import {
	aggregateAmountsByCurrencyId,
	createResponse,
	CRequest,
	currencyBriefMapFromRows,
	DeleteMethodEnum,
	ERROR_MSG,
	fillChangeMethodCurrencyTotalsByActiveIds,
	fillPaymentMethodCurrencyTotalsByActiveIds,
	withCurrencyBriefAmountMany,
	withCurrencyBriefTotalMany,
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
	ReturningChangeCalcEntry,
} from './interfaces'
import { PriceTypeEnum, SellingStatusEnum } from '@prisma/client'
import { CommonService } from '../common'
import { ClientService } from '../client'
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
		private readonly clientService: ClientService,
	) {}

	private calcTotalPricesFromProducts(products: { prices: { type: PriceTypeEnum; currencyId: string; totalPrice: Decimal; currency?: { symbol: string } }[] }[]) {
		const map = new Map<string, { total: Decimal; currency?: { symbol: string } }>()
		for (const product of products) {
			const row = product.prices.find((p) => p.type === PriceTypeEnum.selling) ?? product.prices[0]
			if (!row) continue
			const existing = map.get(row.currencyId) ?? { total: new Decimal(0), currency: row.currency }
			map.set(row.currencyId, { total: existing.total.plus(row.totalPrice), currency: existing.currency || row.currency })
		}
		return Array.from(map.entries()).map(([currencyId, { total, currency }]) => ({ currencyId, total, currency }))
	}

	private buildPaymentData(
		csp:
			| {
					id: string
					description?: string | null
					createdAt: Date
					paymentMethods: { type: string; currencyId: string; amount: Decimal }[]
					changeMethods: { type: string; currencyId: string; amount: Decimal }[]
			  }
			| null
			| undefined,
	): ReturningPaymentData | undefined {
		if (!csp) return undefined
		return {
			id: csp.id,
			description: csp.description,
			paymentMethods: csp.paymentMethods as ReturningPaymentData['paymentMethods'],
			changeMethods: (csp.changeMethods ?? []) as ReturningPaymentData['changeMethods'],
			createdAt: csp.createdAt,
		}
	}

	private calcPaymentTotal(csp: { paymentMethods?: { amount: Decimal }[]; changeMethods?: { amount: Decimal }[] } | null | undefined): Decimal {
		const pm = csp?.paymentMethods?.reduce((acc, m) => acc.plus(m.amount), new Decimal(0)) ?? new Decimal(0)
		const cm = csp?.changeMethods?.reduce((acc, m) => acc.plus(m.amount), new Decimal(0)) ?? new Decimal(0)
		return pm.plus(cm)
	}

	/** MV qatorida faqat `selling` narxi — `SellingService` bilan bir xil: `{ selling: { price, totalPrice, currency } }` */
	private mapReturningLinePricesToObject<
		T extends { prices: { type: PriceTypeEnum; price: Decimal; totalPrice: Decimal; currency: { id: string; name: string; symbol: string } }[] },
	>(line: T) {
		const row = line.prices.find((p) => p.type === PriceTypeEnum.selling) ?? line.prices[0]
		return {
			...line,
			prices: row ? { selling: { price: row.price, totalPrice: row.totalPrice, currency: row.currency } } : { selling: null },
		}
	}

	private mapReturningProductsPrices<T extends { prices: { type: PriceTypeEnum; price: Decimal; totalPrice: Decimal; currency: { id: string; name: string; symbol: string } }[] }>(
		products: T[],
	) {
		return products.map((p) => this.mapReturningLinePricesToObject(p))
	}

	private calcDebtByCurrency(totalPrices: { currencyId: string; total: Decimal; currency?: { symbol: string } }[], payment: ReturningPaymentData | undefined) {
		const debtMap = new Map<string, { amount: Decimal; symbol?: string }>()

		for (const tp of totalPrices) {
			debtMap.set(tp.currencyId, { amount: tp.total, symbol: tp.currency?.symbol })
		}

		for (const method of payment?.paymentMethods ?? []) {
			const existing = debtMap.get(method.currencyId)
			const symbol = existing?.symbol ?? (method as { currency?: { symbol?: string } }).currency?.symbol
			debtMap.set(method.currencyId, { amount: (existing?.amount ?? new Decimal(0)).minus(method.amount), symbol })
		}
		for (const ch of payment?.changeMethods ?? []) {
			const existing = debtMap.get(ch.currencyId)
			const symbol = existing?.symbol ?? (ch as { currency?: { symbol?: string } }).currency?.symbol
			debtMap.set(ch.currencyId, { amount: (existing?.amount ?? new Decimal(0)).minus(ch.amount), symbol })
		}

		return Array.from(debtMap.entries()).map(([currencyId, { amount }]) => ({ currencyId, amount }))
	}

	async findMany(query: ReturningFindManyRequest) {
		const returnings = await this.returningRepository.findMany(query)
		const returningsCount = await this.returningRepository.countFindMany(query)
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()

		const calcMap = new Map<string, Decimal>()
		const mappedReturnings = returnings.map((returning) => {
			for (const method of returning.payment?.paymentMethods ?? []) {
				const key = `${method.type}_${method.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(method.amount))
			}
			for (const ch of returning.payment?.changeMethods ?? []) {
				const key = `change_${ch.type}_${ch.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(ch.amount))
			}

			const totalPrices = this.calcTotalPricesFromProducts(returning.products)
			const payment = this.buildPaymentData(returning.payment)
			const debtByCurrency = this.calcDebtByCurrency(totalPrices, payment)
			const products = this.mapReturningProductsPrices(returning.products)
			const totalPayments = aggregateAmountsByCurrencyId(returning.payment?.paymentMethods)
			const totalChanges = aggregateAmountsByCurrencyId(returning.payment?.changeMethods)

			return { ...returning, products, payment, totalPrices, totalPayments, totalChanges, debtByCurrency }
		})

		const calc: ReturningCalcEntry[] = fillPaymentMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)
		const changeCalc: ReturningChangeCalcEntry[] = fillChangeMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)

		const currencyIdsForBrief = new Set<string>()
		for (const r of mappedReturnings) {
			for (const d of r.debtByCurrency) currencyIdsForBrief.add(d.currencyId)
			for (const t of r.totalPayments) currencyIdsForBrief.add(t.currencyId)
			for (const t of r.totalChanges) currencyIdsForBrief.add(t.currencyId)
		}
		const currencyBriefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIdsForBrief]))
		const returningsWithDebtCurrency = mappedReturnings.map((r) => ({
			...r,
			debtByCurrency: withCurrencyBriefAmountMany(r.debtByCurrency, currencyBriefMap),
			totalPayments: withCurrencyBriefTotalMany(r.totalPayments, currencyBriefMap),
			totalChanges: withCurrencyBriefTotalMany(r.totalChanges, currencyBriefMap),
		}))

		const clientDebtMap = await this.clientService.getDebtSnapshotsByClientIds(returningsWithDebtCurrency.map((r) => r.client.id))
		const dataWithClientDebt = returningsWithDebtCurrency.map((r) => ({
			...r,
			client: {
				...r.client,
				debtByCurrency: clientDebtMap.get(r.client.id) ?? [],
			},
		}))

		const result = query.pagination
			? {
					totalCount: returningsCount,
					pagesCount: Math.ceil(returningsCount / query.pageSize),
					pageSize: dataWithClientDebt.length,
					data: dataWithClientDebt,
					calc,
					changeCalc,
				}
			: { data: dataWithClientDebt, calc, changeCalc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ReturningFindOneRequest) {
		const returning = await this.returningRepository.findOne(query)

		if (!returning) {
			throw new BadRequestException(ERROR_MSG.RETURNING.NOT_FOUND.UZ)
		}

		const totalPrices = this.calcTotalPricesFromProducts(returning.products)
		const payment = this.buildPaymentData(returning.payment)
		let debtByCurrency = this.calcDebtByCurrency(totalPrices, payment)
		const products = this.mapReturningProductsPrices(returning.products)
		const totalPayments = aggregateAmountsByCurrencyId(returning.payment?.paymentMethods)
		const totalChanges = aggregateAmountsByCurrencyId(returning.payment?.changeMethods)

		const currencyIdsForBrief = new Set<string>()
		for (const d of debtByCurrency) currencyIdsForBrief.add(d.currencyId)
		for (const t of totalPayments) currencyIdsForBrief.add(t.currencyId)
		for (const t of totalChanges) currencyIdsForBrief.add(t.currencyId)
		const currencyBriefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIdsForBrief]))
		debtByCurrency = withCurrencyBriefAmountMany(debtByCurrency, currencyBriefMap)

		const clientDebtMap = await this.clientService.getDebtSnapshotsByClientIds([returning.client.id])
		const clientDebt = clientDebtMap.get(returning.client.id) ?? []
		return createResponse({
			data: {
				...returning,
				products,
				payment,
				totalPrices,
				totalPayments: withCurrencyBriefTotalMany(totalPayments, currencyBriefMap),
				totalChanges: withCurrencyBriefTotalMany(totalChanges, currencyBriefMap),
				debtByCurrency,
				client: { ...returning.client, debtByCurrency: clientDebt },
			},
			success: { messages: ['find one success'] },
		})
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
		if ((body.payment?.paymentMethods?.length ?? 0) > 0 || (body.payment?.changeMethods?.length ?? 0) > 0) {
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
		const products = this.mapReturningProductsPrices(returning.products)
		const clientDebtMap = await this.clientService.getDebtSnapshotsByClientIds([returning.client.id])
		const clientDebt = clientDebtMap.get(returning.client.id) ?? []
		return createResponse({
			data: {
				...returning,
				products,
				client: { ...returning.client, debtByCurrency: clientDebt },
			},
			success: { messages: ['create one success'] },
		})
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
