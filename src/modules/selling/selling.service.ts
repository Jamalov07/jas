import { BadRequestException, Injectable } from '@nestjs/common'
import { SellingRepository } from './selling.repository'
import {
	aggregateAmountsByCurrencyId,
	createResponse,
	CRequest,
	currencyBriefMapFromRows,
	ERROR_MSG,
	fillChangeMethodCurrencyTotalsByActiveIds,
	fillCurrencyTotalsByActiveIds,
	fillPaymentMethodCurrencyTotalsByActiveIds,
	type CurrencyBrief,
	netDebtCrossCurrencyRows,
	withCurrencyBriefAmountMany,
	withCurrencyBriefTotalMany,
} from '@common'
import { PriceTypeEnum, SellingStatusEnum } from '@prisma/client'
import {
	SellingGetOneRequest,
	SellingCreateOneRequest,
	SellingUpdateOneRequest,
	SellingGetManyRequest,
	SellingFindManyRequest,
	SellingFindOneRequest,
	SellingDeleteOneRequest,
	SellingCalcEntry,
	SellingChangeCalcEntry,
	SellingFindManyCalcPage,
	SellingPaymentData,
} from './interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { CommonService } from '../common'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { BotService } from '../bot'
import { BotSellingProductTitleEnum, BotSellingTitleEnum } from './enums'
import { ClientService } from '../client'
import { CurrencyRepository } from '../currency'

@Injectable()
export class SellingService {
	constructor(
		private readonly sellingRepository: SellingRepository,
		private readonly commonService: CommonService,
		private readonly excelService: ExcelService,
		private readonly botService: BotService,
		private readonly clientService: ClientService,
		private readonly currencyRepository: CurrencyRepository,
	) {}

	/** Selling MV da har bir qatorda narxlarda faqat `selling` — bitta qatorni valyuta bo‘yicha yig‘amiz */
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
	): SellingPaymentData | undefined {
		if (!csp) return undefined
		return {
			id: csp.id,
			description: csp.description,
			paymentMethods: csp.paymentMethods as SellingPaymentData['paymentMethods'],
			changeMethods: (csp.changeMethods ?? []) as SellingPaymentData['changeMethods'],
			createdAt: csp.createdAt,
		}
	}

	private calcPaymentTotal(csp: { paymentMethods?: { amount: Decimal }[]; changeMethods?: { amount: Decimal }[] } | null | undefined): Decimal {
		const pm = csp?.paymentMethods?.reduce((acc, m) => acc.plus(m.amount), new Decimal(0)) ?? new Decimal(0)
		const cm = csp?.changeMethods?.reduce((acc, m) => acc.plus(m.amount), new Decimal(0)) ?? new Decimal(0)
		return pm.plus(cm)
	}

	private mapSellingLinePricesToObject<
		T extends { prices: { type: PriceTypeEnum; price: Decimal; totalPrice: Decimal; currency: { id: string; name: string; symbol: string } }[] },
	>(line: T) {
		const row = line.prices.find((p) => p.type === PriceTypeEnum.selling) ?? line.prices[0]
		return {
			...line,
			prices: row ? { selling: { price: row.price, totalPrice: row.totalPrice, currency: row.currency } } : { selling: null },
		}
	}

	private mapSellingProductsPrices<
		T extends { count: number; prices: { type: PriceTypeEnum; price: Decimal; totalPrice: Decimal; currency: { id: string; name: string; symbol: string } }[] },
	>(products: T[]) {
		return products.map((p) => this.mapSellingLinePricesToObject(p))
	}

	private calcDebtByCurrency(totalPrices: { currencyId: string; total: Decimal; currency?: { symbol: string } }[], payment: SellingPaymentData | undefined) {
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
			debtMap.set(ch.currencyId, { amount: (existing?.amount ?? new Decimal(0)).plus(ch.amount), symbol })
		}

		return Array.from(debtMap.entries()).map(([currencyId, { amount }]) => ({ currencyId, amount }))
	}

	private calcDebtByCurrency2(totalPrices: { currencyId: string; total: Decimal; currency?: { symbol: string } }[], payment: SellingPaymentData | undefined) {
		const debtMap = new Map<string, { amount: Decimal; currency?: { symbol?: string } }>()

		for (const tp of totalPrices) {
			debtMap.set(tp.currencyId, { amount: tp.total, currency: tp.currency })
		}

		for (const method of payment?.paymentMethods ?? []) {
			const existing = debtMap.get(method.currencyId)

			const currency = existing?.currency ?? (method as { currency?: { symbol?: string } }).currency

			debtMap.set(method.currencyId, {
				amount: (existing?.amount ?? new Decimal(0)).minus(method.amount),
				currency,
			})
		}

		for (const ch of payment?.changeMethods ?? []) {
			const existing = debtMap.get(ch.currencyId)

			const currency = existing?.currency ?? (ch as { currency?: { symbol?: string } }).currency

			debtMap.set(ch.currencyId, {
				amount: (existing?.amount ?? new Decimal(0)).plus(ch.amount),
				currency,
			})
		}

		return Array.from(debtMap.entries()).map(([currencyId, { amount, currency }]) => ({
			currencyId,
			amount,
			currency,
		}))
	}

	/** Joriy `findMany` sahifasidagi barcha sellinglar bo‘yicha yig‘indilar */
	private buildFindManyCalcPage(
		sellings: Awaited<ReturnType<SellingRepository['findMany']>>,
		activeCurrencyIds: string[],
		briefMap: Map<string, CurrencyBrief>,
		debtRates: Map<string, Decimal>,
		debtSymbols: Map<string, string>,
	): SellingFindManyCalcPage {
		const pageTotalPricesMap = new Map<string, Decimal>()
		const pageTotalPaymentsMap = new Map<string, Decimal>()
		const pagePaymentMethodMap = new Map<string, Decimal>()
		const pageDebtAmountMap = new Map<string, Decimal>()

		for (const selling of sellings) {
			const totalPricesRows = this.calcTotalPricesFromProducts(selling.products)
			for (const row of totalPricesRows) {
				pageTotalPricesMap.set(row.currencyId, (pageTotalPricesMap.get(row.currencyId) ?? new Decimal(0)).plus(row.total))
			}
			for (const m of selling.payment?.paymentMethods ?? []) {
				pageTotalPaymentsMap.set(m.currencyId, (pageTotalPaymentsMap.get(m.currencyId) ?? new Decimal(0)).plus(m.amount))
				const key = `${m.type}_${m.currencyId}`
				pagePaymentMethodMap.set(key, (pagePaymentMethodMap.get(key) ?? new Decimal(0)).plus(m.amount))
			}
			const payment = this.buildPaymentData(selling.payment)
			const debtRows = netDebtCrossCurrencyRows(this.calcDebtByCurrency(totalPricesRows, payment), debtRates, debtSymbols)
			for (const d of debtRows) {
				pageDebtAmountMap.set(d.currencyId, (pageDebtAmountMap.get(d.currencyId) ?? new Decimal(0)).plus(d.amount))
			}
		}

		const methodRows = fillPaymentMethodCurrencyTotalsByActiveIds(activeCurrencyIds, pagePaymentMethodMap)
		const briefOrFallback = (currencyId: string): CurrencyBrief => briefMap.get(currencyId) ?? { id: currencyId, name: '', symbol: '' }

		return {
			totalPrices: withCurrencyBriefTotalMany(fillCurrencyTotalsByActiveIds(activeCurrencyIds, pageTotalPricesMap), briefMap),
			totalPayments: withCurrencyBriefTotalMany(fillCurrencyTotalsByActiveIds(activeCurrencyIds, pageTotalPaymentsMap), briefMap),
			totalMethods: methodRows.map((row) => ({ ...row, currency: briefOrFallback(row.currencyId) })),
			totalDebts: withCurrencyBriefTotalMany(fillCurrencyTotalsByActiveIds(activeCurrencyIds, pageDebtAmountMap), briefMap),
		}
	}

	async findMany(query: SellingFindManyRequest) {
		const sellings = await this.sellingRepository.findMany(query)
		const sellingsCount = await this.sellingRepository.countFindMany(query)
		const activeCurrencyIds = await this.currencyRepository.findAllActiveIds()
		const activeBriefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds(activeCurrencyIds))
		const { rates: activeDebtRates, symbols: activeDebtSymbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds(activeCurrencyIds)
		const calcPage = this.buildFindManyCalcPage(sellings, activeCurrencyIds, activeBriefMap, activeDebtRates, activeDebtSymbols)

		const clientsWithDebt = await this.clientService.findMany({ ids: sellings.map((s) => s.client.id) })

		const clientsWithDebtObject: Record<string, any> = {}
		for (const c of clientsWithDebt.data.data) {
			clientsWithDebtObject[c.id] = c.debtByCurrency
		}

		const sellingDebtCurrIds = new Set<string>()
		for (const selling of sellings) {
			const tp = this.calcTotalPricesFromProducts(selling.products)
			const pay = this.buildPaymentData(selling.payment)
			for (const d of this.calcDebtByCurrency(tp, pay)) sellingDebtCurrIds.add(d.currencyId)
		}
		const { rates: sellingDebtRates, symbols: sellingDebtSymbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...sellingDebtCurrIds])

		const calcMap = new Map<string, Decimal>()
		const mappedSellings = sellings.map((selling) => {
			for (const method of selling.payment?.paymentMethods ?? []) {
				const key = `${method.type}_${method.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(method.amount))
			}
			for (const ch of selling.payment?.changeMethods ?? []) {
				const key = `change_${ch.type}_${ch.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(ch.amount))
			}

			const totalPrices = this.calcTotalPricesFromProducts(selling.products)
			const payment = this.buildPaymentData(selling.payment)
			const debtByCurrency = netDebtCrossCurrencyRows(this.calcDebtByCurrency(totalPrices, payment), sellingDebtRates, sellingDebtSymbols)
			const products = this.mapSellingProductsPrices(selling.products)
			const totalPayments = aggregateAmountsByCurrencyId(selling.payment?.paymentMethods)
			const totalChanges = aggregateAmountsByCurrencyId(selling.payment?.changeMethods)

			return {
				...selling,
				products,
				payment,
				totalPrices,
				totalPayments,
				totalChanges,
				debtByCurrency,
				client: { ...selling.client, debtByCurrency: clientsWithDebtObject[selling.client.id] || [] },
			}
		})

		const calc: SellingCalcEntry[] = fillPaymentMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)
		const changeCalc: SellingChangeCalcEntry[] = fillChangeMethodCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)

		const currencyIdsForBrief = new Set<string>()
		for (const s of mappedSellings) {
			for (const d of s.debtByCurrency) currencyIdsForBrief.add(d.currencyId)
			for (const t of s.totalPayments) currencyIdsForBrief.add(t.currencyId)
			for (const t of s.totalChanges) currencyIdsForBrief.add(t.currencyId)
			for (const d of clientsWithDebtObject[s.client.id] ?? []) currencyIdsForBrief.add(d.currencyId)
		}
		const currencyBriefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIdsForBrief]))
		const sellingsWithDebtCurrency = mappedSellings.map((s) => ({
			...s,
			debtByCurrency: withCurrencyBriefAmountMany(s.debtByCurrency, currencyBriefMap),
			totalPayments: withCurrencyBriefTotalMany(s.totalPayments, currencyBriefMap),
			totalChanges: withCurrencyBriefTotalMany(s.totalChanges, currencyBriefMap),
			client: {
				...s.client,
				debtByCurrency: withCurrencyBriefAmountMany(clientsWithDebtObject[s.client.id] ?? [], currencyBriefMap),
			},
		}))

		const result = query.pagination
			? {
					totalCount: sellingsCount,
					pagesCount: Math.ceil(sellingsCount / query.pageSize),
					pageSize: sellings.length,
					data: sellingsWithDebtCurrency,
					calc,
					changeCalc,
					calcPage,
				}
			: { data: sellingsWithDebtCurrency, calc, changeCalc, calcPage }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: SellingFindOneRequest) {
		const selling = await this.sellingRepository.findOne(query)

		if (!selling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		const totalPrices = this.calcTotalPricesFromProducts(selling.products)
		const payment = this.buildPaymentData(selling.payment)
		const debtRaw = this.calcDebtByCurrency(totalPrices, payment)
		const { rates: oneSellingRates, symbols: oneSellingSymbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds(debtRaw.map((d) => d.currencyId))
		let debtByCurrency = netDebtCrossCurrencyRows(debtRaw, oneSellingRates, oneSellingSymbols)
		const products = this.mapSellingProductsPrices(selling.products)
		const totalPayments = aggregateAmountsByCurrencyId(selling.payment?.paymentMethods)
		const totalChanges = aggregateAmountsByCurrencyId(selling.payment?.changeMethods)

		const clientsWithDebt = await this.clientService.findMany({ ids: [selling.client.id] })

		const clientsWithDebtObject: Record<string, any> = {}
		for (const c of clientsWithDebt.data.data) {
			clientsWithDebtObject[c.id] = c.debtByCurrency
		}

		const currencyIdsForBrief = new Set<string>()
		for (const d of debtByCurrency) currencyIdsForBrief.add(d.currencyId)
		for (const t of totalPayments) currencyIdsForBrief.add(t.currencyId)
		for (const t of totalChanges) currencyIdsForBrief.add(t.currencyId)
		for (const d of clientsWithDebtObject[selling.client.id] ?? []) currencyIdsForBrief.add(d.currencyId)
		const currencyBriefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIdsForBrief]))
		debtByCurrency = withCurrencyBriefAmountMany(debtByCurrency, currencyBriefMap)

		return createResponse({
			data: {
				...selling,
				products,
				payment,
				totalPrices,
				totalPayments: withCurrencyBriefTotalMany(totalPayments, currencyBriefMap),
				totalChanges: withCurrencyBriefTotalMany(totalChanges, currencyBriefMap),
				debtByCurrency,
				client: {
					...selling.client,
					debtByCurrency: withCurrencyBriefAmountMany(clientsWithDebtObject[selling.client.id] ?? [], currencyBriefMap),
				},
			},
			success: { messages: ['find one success'] },
		})
	}

	async getMany(query: SellingGetManyRequest) {
		const sellings = await this.sellingRepository.getMany(query)
		const sellingsCount = await this.sellingRepository.countGetMany(query)

		const result = query.pagination ? { pagesCount: Math.ceil(sellingsCount / query.pageSize), pageSize: sellings.length, data: sellings } : { data: sellings }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: SellingGetOneRequest) {
		const selling = await this.sellingRepository.getOne(query)

		if (!selling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		return createResponse({ data: selling, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: SellingCreateOneRequest) {
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

		const selling = await this.sellingRepository.createOne(body)

		if (body.send && selling.status === SellingStatusEnum.accepted) {
			try {
				const clientResult = await this.clientService.findOne({ id: body.clientId })
				const totalPrices = this.calcTotalPricesFromProducts(selling.products)
				const payment = this.buildPaymentData(selling.payment)

				const sellingInfo = {
					...selling,
					client: clientResult.data,
					title: BotSellingTitleEnum.new,
					totalPrices,
					payment,
					debtByCurrency: this.calcDebtByCurrency2(totalPrices, payment),
					products: selling.products.map((p) => ({ ...p, status: BotSellingProductTitleEnum.new })),
				} as any

				if (clientResult.data.telegram?.id) {
					await this.botService.sendSellingToClient(sellingInfo).catch((e) => console.log('bot client error:', e))
				}
				await this.botService.sendSellingToChannel(sellingInfo).catch((e) => console.log('bot channel error:', e))

				if ((payment?.paymentMethods?.length ?? 0) > 0 || (payment?.changeMethods?.length ?? 0) > 0) {
					await this.botService.sendPaymentToChannel(payment, false, clientResult.data).catch((e) => console.log('bot payment error:', e))
				}
			} catch (e) {
				console.log('bot send error:', e)
			}
		}

		const data = {
			...selling,
			products: this.mapSellingProductsPrices(selling.products),
			totalPrices: this.calcTotalPricesFromProducts(selling.products),
			payment: this.buildPaymentData(selling.payment),
		}
		return createResponse({ data, success: { messages: ['create one success'] } })
	}

	async updateOne(request: CRequest, query: SellingGetOneRequest, body: SellingUpdateOneRequest) {
		const existingSelling = await this.sellingRepository.findOne({ id: query.id })
		if (!existingSelling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		if ((body.payment?.paymentMethods?.length ?? 0) > 0 || (body.payment?.changeMethods?.length ?? 0) > 0) {
			body.status = SellingStatusEnum.accepted
		}

		if (body.status === SellingStatusEnum.accepted) {
			const wasNotAccepted = existingSelling.status !== SellingStatusEnum.accepted
			if (wasNotAccepted) {
				const dayClose = await this.commonService.getDayClose({})
				if (dayClose.data.isClosed) {
					const tomorrow = new Date()
					tomorrow.setDate(tomorrow.getDate() + 1)
					tomorrow.setHours(0, 0, 0, 0)
					body.date = tomorrow
				} else {
					body.date = new Date()
				}
			}
		} else if (body.date) {
			const inputDate = new Date(body.date)
			const now = new Date()
			const isToday = inputDate.getFullYear() === now.getFullYear() && inputDate.getMonth() === now.getMonth() && inputDate.getDate() === now.getDate()
			body.date = isToday ? now : new Date(inputDate.setHours(0, 0, 0, 0))
		}

		body.staffId = request.user.id

		await this.sellingRepository.updateOne(query, body)

		const updatedSelling = await this.sellingRepository.findOne({ id: query.id })
		const wasAccepted = existingSelling.status === SellingStatusEnum.accepted
		const isAcceptedNow = updatedSelling.status === SellingStatusEnum.accepted

		if (wasAccepted || isAcceptedNow) {
			try {
				const clientResult = await this.clientService.findOne({ id: existingSelling.client.id })
				const totalPrices = this.calcTotalPricesFromProducts(updatedSelling.products)
				const payment = this.buildPaymentData(updatedSelling.payment)
				const isFirstAccept = !wasAccepted && isAcceptedNow

				const sellingInfo = {
					...updatedSelling,
					client: clientResult.data,
					title: isFirstAccept ? BotSellingTitleEnum.new : BotSellingTitleEnum.updated,
					totalPrices,
					payment,
					debtByCurrency: this.calcDebtByCurrency2(totalPrices, payment),
					products: updatedSelling.products.map((p) => ({ ...p, status: BotSellingProductTitleEnum.new })),
				} as any

				if (body.send && clientResult.data.telegram?.id) {
					await this.botService.sendSellingToClient(sellingInfo).catch((e) => console.log('bot client error:', e))
				}

				await this.botService.sendSellingToChannel(sellingInfo).catch((e) => console.log('bot channel error:', e))

				const prevPaymentTotal = this.calcPaymentTotal(existingSelling.payment)
				const newPaymentTotal = this.calcPaymentTotal(updatedSelling.payment)
				const paymentChanged = !prevPaymentTotal.equals(newPaymentTotal)
				const hadPaymentBefore = !prevPaymentTotal.isZero()
				const isModified = hadPaymentBefore && paymentChanged

				const shouldSendPayment =
					(isFirstAccept && ((payment?.paymentMethods?.length ?? 0) > 0 || (payment?.changeMethods?.length ?? 0) > 0)) ||
					(wasAccepted && paymentChanged && ((payment?.paymentMethods?.length ?? 0) > 0 || (payment?.changeMethods?.length ?? 0) > 0))

				if (shouldSendPayment) {
					await this.botService.sendPaymentToChannel(payment, isModified, clientResult.data).catch((e) => console.log('bot payment error:', e))
				}
			} catch (e) {
				console.log('bot send error:', e)
			}
		}

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: SellingDeleteOneRequest) {
		const selling = await this.sellingRepository.findOne({ id: query.id })
		if (!selling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		const wasAccepted = selling.status === SellingStatusEnum.accepted
		let clientResult: Awaited<ReturnType<typeof this.clientService.findOne>> | undefined

		if (wasAccepted) {
			try {
				clientResult = await this.clientService.findOne({ id: selling.client.id })
			} catch (e) {
				console.log('bot client fetch error:', e)
			}
		}

		await this.sellingRepository.deleteOne(query)

		if (wasAccepted && clientResult) {
			try {
				const totalPrices = this.calcTotalPricesFromProducts(selling.products)
				const payment = this.buildPaymentData(selling.payment)

				const sellingInfo = {
					...selling,
					client: clientResult.data,
					title: BotSellingTitleEnum.deleted,
					totalPrices,
					payment,
				} as any

				await this.botService.sendDeletedSellingToChannel(sellingInfo).catch((e) => console.log('bot channel error:', e))

				if ((payment?.paymentMethods?.length ?? 0) > 0 || (payment?.changeMethods?.length ?? 0) > 0) {
					await this.botService.sendDeletedPaymentToChannel(payment, clientResult.data).catch((e) => console.log('bot payment error:', e))
				}
			} catch (e) {
				console.log('bot send error:', e)
			}
		}

		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: SellingFindManyRequest) {
		return this.excelService.sellingDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: SellingFindOneRequest) {
		return this.excelService.sellingDownloadOne(res, query)
	}
}
