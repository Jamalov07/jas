import { BadRequestException, Injectable } from '@nestjs/common'
import { ArrivalRepository } from './arrival.repository'
import {
	createResponse,
	CRequest,
	currencyBriefMapFromRows,
	ERROR_MSG,
	fillPaymentMethodCurrencyTotalsByActiveIds,
	withCurrencyBriefAmountMany,
} from '@common'
import {
	ArrivalGetOneRequest,
	ArrivalCreateOneRequest,
	ArrivalUpdateOneRequest,
	ArrivalGetManyRequest,
	ArrivalFindManyRequest,
	ArrivalFindOneRequest,
	ArrivalDeleteOneRequest,
} from './interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum } from '@prisma/client'

type PriceEntry = { type: string; price: Decimal; totalPrice: Decimal; currencyId: string; currency: { symbol: string } }
type ProductEntry = { prices: PriceEntry[] }
type PaymentMethodEntry = { type: string; currencyId: string; amount: Decimal; currency?: { symbol: string } | null }
import { ExcelService } from '../shared'
import { Response } from 'express'
import { CurrencyRepository } from '../currency'

@Injectable()
export class ArrivalService {
	constructor(
		private readonly arrivalRepository: ArrivalRepository,
		private readonly excelService: ExcelService,
		private readonly currencyRepository: CurrencyRepository,
	) {}

	private calcTotalPricesByType(products: ProductEntry[]) {
		const map = new Map<string, Map<string, { total: Decimal; symbol: string }>>()

		for (const product of products) {
			for (const price of product.prices) {
				if (!map.has(price.type)) map.set(price.type, new Map())
				const currMap = map.get(price.type)
				const existing = currMap.get(price.currencyId)
				currMap.set(price.currencyId, {
					total: (existing?.total ?? new Decimal(0)).plus(price.totalPrice),
					symbol: existing?.symbol || price.currency?.symbol || '',
				})
			}
		}

		const result: Record<string, { currencyId: string; total: Decimal; currency: { symbol: string } }[]> = {}
		for (const [type, currMap] of map.entries()) {
			result[type] = Array.from(currMap.entries()).map(([currencyId, { total, symbol }]) => ({ currencyId, total, currency: { symbol } }))
		}
		return result
	}

	/** findOne response: prices as { cost: {...}, selling: {...} } instead of array */
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

	private calcDebtByCurrency(totalPrices: Record<string, { currencyId: string; total: Decimal; currency: { symbol: string } }[]>, paymentMethods: PaymentMethodEntry[]) {
		const debtMap = new Map<string, { amount: Decimal; symbol: string }>()

		for (const entry of totalPrices['cost'] ?? []) {
			const existing = debtMap.get(entry.currencyId)
			debtMap.set(entry.currencyId, { amount: (existing?.amount ?? new Decimal(0)).plus(entry.total), symbol: existing?.symbol || entry.currency.symbol })
		}

		for (const method of paymentMethods) {
			const existing = debtMap.get(method.currencyId)
			const symbol = existing?.symbol || method.currency?.symbol || ''
			if (method.type === PaymentMethodEnum.fromCash || method.type === PaymentMethodEnum.fromBalance) {
				// Change returned to business or credited to balance — reduces effective payment, increases debt
				debtMap.set(method.currencyId, { amount: (existing?.amount ?? new Decimal(0)).plus(method.amount), symbol })
			} else {
				debtMap.set(method.currencyId, { amount: (existing?.amount ?? new Decimal(0)).minus(method.amount), symbol })
			}
		}

		return Array.from(debtMap.entries()).map(([currencyId, { amount }]) => ({ currencyId, amount }))
	}

	async findMany(query: ArrivalFindManyRequest) {
		const arrivals = await this.arrivalRepository.findMany(query)
		const arrivalsCount = await this.arrivalRepository.countFindMany(query)
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()

		const calcMap = new Map<string, Decimal>()
		const mappedArrivals = arrivals.map((arrival) => {
			for (const method of arrival.payment?.methods ?? []) {
				const key = `${method.type}_${method.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(method.amount))
			}
			const sap = arrival.payment
			const payment = sap ? { id: sap.id, description: sap.description, createdAt: sap.createdAt, paymentMethods: sap.methods } : undefined
			const totalPrices = this.calcTotalPricesByType(arrival.products as ProductEntry[])
			const debtByCurrency = this.calcDebtByCurrency(totalPrices, (payment?.paymentMethods ?? []) as PaymentMethodEntry[])
			return { ...arrival, payment, totalPrices, debtByCurrency }
		})

		const calc = fillPaymentMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)

		const debtCurrencyIds = new Set<string>()
		for (const a of mappedArrivals) {
			for (const d of a.debtByCurrency) debtCurrencyIds.add(d.currencyId)
		}
		const debtCurrencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...debtCurrencyIds]))
		const arrivalsWithDebtCurrency = mappedArrivals.map((a) => ({
			...a,
			debtByCurrency: withCurrencyBriefAmountMany(a.debtByCurrency, debtCurrencyMap),
		}))

		const result = query.pagination
			? {
					totalCount: arrivalsCount,
					pagesCount: Math.ceil(arrivalsCount / query.pageSize),
					pageSize: arrivalsWithDebtCurrency.length,
					data: arrivalsWithDebtCurrency,
					calc,
				}
			: { data: arrivalsWithDebtCurrency, calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ArrivalFindOneRequest) {
		const arrival = await this.arrivalRepository.findOne(query)

		if (!arrival) {
			throw new BadRequestException(ERROR_MSG.ARRIVAL.NOT_FOUND.UZ)
		}

		const sap = arrival.payment
		const payment = sap ? { id: sap.id, description: sap.description, createdAt: sap.createdAt, paymentMethods: sap.methods } : undefined
		const totalPrices = this.calcTotalPricesByType(arrival.products as ProductEntry[])
		let debtByCurrency = this.calcDebtByCurrency(totalPrices, (payment?.paymentMethods ?? []) as PaymentMethodEntry[])
		const products = this.mapProductsPricesToByType(arrival.products as ProductEntry[])
		const debtCurrencyMap = currencyBriefMapFromRows(
			await this.currencyRepository.findBriefByIds(debtByCurrency.map((d) => d.currencyId)),
		)
		debtByCurrency = withCurrencyBriefAmountMany(debtByCurrency, debtCurrencyMap)
		return createResponse({ data: { ...arrival, products, payment, totalPrices, debtByCurrency }, success: { messages: ['find one success'] } })
	}

	async getMany(query: ArrivalGetManyRequest) {
		const arrivals = await this.arrivalRepository.getMany(query)
		const arrivalsCount = await this.arrivalRepository.countGetMany(query)

		const result = query.pagination ? { pagesCount: Math.ceil(arrivalsCount / query.pageSize), pageSize: arrivals.length, data: arrivals } : { data: arrivals }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ArrivalGetOneRequest) {
		const arrival = await this.arrivalRepository.getOne(query)

		if (!arrival) {
			throw new BadRequestException(ERROR_MSG.ARRIVAL.NOT_FOUND.UZ)
		}

		return createResponse({ data: arrival, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: ArrivalCreateOneRequest) {
		body.staffId = request.user.id
		const arrival = await this.arrivalRepository.createOne(body)
		const data = {
			...arrival,
			payment: arrival.payment ? { ...arrival.payment, paymentMethods: arrival.payment.methods } : undefined,
		}
		return createResponse({ data, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ArrivalGetOneRequest, body: ArrivalUpdateOneRequest) {
		await this.getOne(query)
		await this.arrivalRepository.updateOne(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ArrivalDeleteOneRequest) {
		await this.getOne(query)
		await this.arrivalRepository.deleteOne(query)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: ArrivalFindManyRequest) {
		return this.excelService.arrivalDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: ArrivalFindOneRequest) {
		return this.excelService.arrivalDownloadOne(res, query)
	}
}
