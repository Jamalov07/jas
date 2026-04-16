import { BadRequestException, Injectable } from '@nestjs/common'
import { ArrivalRepository } from './arrival.repository'
import {
	createResponse,
	CRequest,
	currencyBriefMapFromRows,
	ERROR_MSG,
	fillChangeMethodCurrencyTotalsByActiveIds,
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
import { PriceTypeEnum } from '@prisma/client'

type PriceEntry = { type: string; price: Decimal; totalPrice: Decimal; currencyId: string; currency: { symbol: string } }
type ArrivalMvPriceRow = {
	type: PriceTypeEnum
	price: Decimal
	totalPrice: Decimal
	currency: { id: string; name: string; symbol: string; exchangeRate: Decimal }
}
type ProductEntry = { prices: PriceEntry[] }
type PaymentMethodEntry = { type: string; currencyId: string; amount: Decimal; currency?: { symbol: string } | null }
type ChangeMethodEntry = { type: string; currencyId: string; amount: Decimal; currency?: { symbol: string } | null }
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

	/** MV qatorida `cost` va `selling` — har biri `{ price, totalPrice, currency }` */
	private mapArrivalLinePricesToObject<T extends { prices: ArrivalMvPriceRow[] }>(line: T) {
		const cost = line.prices.find((p) => p.type === PriceTypeEnum.cost)
		const selling = line.prices.find((p) => p.type === PriceTypeEnum.selling)
		return {
			...line,
			prices: {
				cost: cost ? { price: cost.price, totalPrice: cost.totalPrice, currency: cost.currency } : null,
				selling: selling ? { price: selling.price, totalPrice: selling.totalPrice, currency: selling.currency } : null,
			},
		}
	}

	private mapArrivalProductsPrices<T extends { prices: ArrivalMvPriceRow[] }>(products: T[]) {
		return products.map((p) => this.mapArrivalLinePricesToObject(p))
	}

	private calcDebtByCurrency(
		totalPrices: Record<string, { currencyId: string; total: Decimal; currency: { symbol: string } }[]>,
		paymentMethods: PaymentMethodEntry[],
		changeMethods: ChangeMethodEntry[],
	) {
		const debtMap = new Map<string, { amount: Decimal; symbol: string }>()

		for (const entry of totalPrices['cost'] ?? []) {
			const existing = debtMap.get(entry.currencyId)
			debtMap.set(entry.currencyId, { amount: (existing?.amount ?? new Decimal(0)).plus(entry.total), symbol: existing?.symbol || entry.currency.symbol })
		}

		for (const method of paymentMethods) {
			const existing = debtMap.get(method.currencyId)
			const symbol = existing?.symbol || method.currency?.symbol || ''
			debtMap.set(method.currencyId, { amount: (existing?.amount ?? new Decimal(0)).minus(method.amount), symbol })
		}

		for (const ch of changeMethods) {
			const existing = debtMap.get(ch.currencyId)
			const symbol = existing?.symbol || ch.currency?.symbol || ''
			debtMap.set(ch.currencyId, { amount: (existing?.amount ?? new Decimal(0)).plus(ch.amount), symbol })
		}

		return Array.from(debtMap.entries()).map(([currencyId, { amount }]) => ({ currencyId, amount }))
	}

	async findMany(query: ArrivalFindManyRequest) {
		const arrivals = await this.arrivalRepository.findMany(query)
		const arrivalsCount = await this.arrivalRepository.countFindMany(query)
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()

		const calcMap = new Map<string, Decimal>()
		const mappedArrivals = arrivals.map((arrival) => {
			for (const method of arrival.payment?.paymentMethods ?? []) {
				const key = `${method.type}_${method.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(method.amount))
			}
			for (const ch of arrival.payment?.changeMethods ?? []) {
				const key = `change_${ch.type}_${ch.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(ch.amount))
			}
			const sap = arrival.payment
			const payment = sap
				? {
						id: sap.id,
						description: sap.description,
						createdAt: sap.createdAt,
						paymentMethods: sap.paymentMethods,
						changeMethods: sap.changeMethods ?? [],
					}
				: undefined
			const totalPrices = this.calcTotalPricesByType(arrival.products as ProductEntry[])
			const debtByCurrency = this.calcDebtByCurrency(totalPrices, (payment?.paymentMethods ?? []) as PaymentMethodEntry[], (payment?.changeMethods ?? []) as ChangeMethodEntry[])
			const products = this.mapArrivalProductsPrices(arrival.products as { prices: ArrivalMvPriceRow[] }[])
			return { ...arrival, products, payment, totalPrices, debtByCurrency }
		})

		const calc = fillPaymentMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)
		const changeCalc = fillChangeMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)

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
					changeCalc,
				}
			: { data: arrivalsWithDebtCurrency, calc, changeCalc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ArrivalFindOneRequest) {
		const arrival = await this.arrivalRepository.findOne(query)

		if (!arrival) {
			throw new BadRequestException(ERROR_MSG.ARRIVAL.NOT_FOUND.UZ)
		}

		const sap = arrival.payment
		const payment = sap
			? {
					id: sap.id,
					description: sap.description,
					createdAt: sap.createdAt,
					paymentMethods: sap.paymentMethods,
					changeMethods: sap.changeMethods ?? [],
				}
			: undefined
		const totalPrices = this.calcTotalPricesByType(arrival.products as ProductEntry[])
		let debtByCurrency = this.calcDebtByCurrency(totalPrices, (payment?.paymentMethods ?? []) as PaymentMethodEntry[], (payment?.changeMethods ?? []) as ChangeMethodEntry[])
		const products = this.mapArrivalProductsPrices(arrival.products as { prices: ArrivalMvPriceRow[] }[])
		const debtCurrencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds(debtByCurrency.map((d) => d.currencyId)))
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
		const products = this.mapArrivalProductsPrices(arrival.products as { prices: ArrivalMvPriceRow[] }[])
		const data = {
			...arrival,
			products,
			payment: arrival.payment
				? {
						...arrival.payment,
						paymentMethods: arrival.payment.paymentMethods,
						changeMethods: arrival.payment.changeMethods ?? [],
					}
				: undefined,
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
