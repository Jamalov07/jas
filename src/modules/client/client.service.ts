import { BadRequestException, Injectable } from '@nestjs/common'
import { ClientRepository } from './client.repository'
import {
	createResponse,
	currencyBriefMapFromRows,
	CurrencyBrief,
	DebtTypeEnum,
	DeleteMethodEnum,
	ERROR_MSG,
	netDebtCrossCurrencyRows,
	roundDebtDecimal,
	withCurrencyBrief,
	withCurrencyBriefAmountMany,
} from '@common'
import {
	ClientGetOneRequest,
	ClientCreateOneRequest,
	ClientUpdateOneRequest,
	ClientGetManyRequest,
	ClientFindManyRequest,
	ClientFindOneRequest,
	ClientDeleteOneRequest,
	ClientDebtByCurrency,
	ClientDeed,
	ClientReportCurrencyTotal,
	ClientReportPaymentRow,
	ClientReportSummary,
} from './interfaces'
import { ChangeMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const isChangeBalanceExcludedFromDebt = (type: string) => type === ChangeMethodEnum.balance
import { ExcelService } from '../shared'
import { Response } from 'express'
import { CurrencyRepository } from '../currency'

@Injectable()
export class ClientService {
	private readonly clientRepository: ClientRepository

	constructor(
		clientRepository: ClientRepository,
		private readonly currencyRepository: CurrencyRepository,
		private readonly excelService: ExcelService,
	) {
		this.clientRepository = clientRepository
	}

	private calcDebtByCurrency(
		sellings: Array<{
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: {
				paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
				changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
			} | null
		}>,
		payments: Array<{
			paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
			changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
		}>,
		returnings: Array<{
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: {
				paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
				changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
			} | null
		}>,
	): Map<string, Decimal> {
		const debtMap = new Map<string, Decimal>()

		for (const sel of sellings) {
			for (const product of sel.products) {
				for (const price of product.prices) {
					const curr = debtMap.get(price.currencyId) ?? new Decimal(0)
					debtMap.set(price.currencyId, curr.plus(price.totalPrice))
				}
			}
			if (sel.payment) {
				for (const method of sel.payment.paymentMethods) {
					const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
					debtMap.set(method.currencyId, curr.minus(method.amount))
				}
				for (const ch of sel.payment.changeMethods ?? []) {
					const curr = debtMap.get(ch.currencyId) ?? new Decimal(0)
					debtMap.set(ch.currencyId, curr.plus(ch.amount))
				}
			}
		}

		for (const ret of returnings) {
			for (const product of ret.products) {
				for (const price of product.prices) {
					const curr = debtMap.get(price.currencyId) ?? new Decimal(0)
					debtMap.set(price.currencyId, curr.minus(price.totalPrice))
				}
			}
			if (ret.payment) {
				for (const method of ret.payment.paymentMethods) {
					const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
					debtMap.set(method.currencyId, curr.plus(method.amount))
				}
				for (const ch of ret.payment.changeMethods ?? []) {
					const curr = debtMap.get(ch.currencyId) ?? new Decimal(0)
					debtMap.set(ch.currencyId, curr.plus(ch.amount))
				}
			}
		}

		for (const payment of payments) {
			for (const method of payment.paymentMethods) {
				const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
				debtMap.set(method.currencyId, curr.minus(method.amount))
			}
			for (const ch of payment.changeMethods ?? []) {
				if (isChangeBalanceExcludedFromDebt(ch.type)) continue
				const curr = debtMap.get(ch.currencyId) ?? new Decimal(0)
				if (ch.type === ChangeMethodEnum.cash) {
					debtMap.set(ch.currencyId, curr.plus(ch.amount))
				} else {
					debtMap.set(ch.currencyId, curr.minus(ch.amount))
				}
			}
		}

		return debtMap
	}

	/** Bir yoki bir nechta mijoz uchun joriy qarz (client `findMany` bilan bir xil), valyuta obyekti bilan */
	async getDebtSnapshotsByClientIds(clientIds: string[]): Promise<Map<string, ClientDebtByCurrency[]>> {
		const rows = await this.clientRepository.findDebtSourcesByClientIds(clientIds)
		const allCurrencyIds = new Set<string>()
		const rawByClient = new Map<string, { currencyId: string; amount: Decimal }[]>()
		for (const row of rows) {
			const debtMap = this.calcDebtByCurrency(row.sellings, row.payments, row.returnings)
			for (const id of debtMap.keys()) allCurrencyIds.add(id)
			rawByClient.set(
				row.id,
				Array.from(debtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount })),
			)
		}
		const { rates, symbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...allCurrencyIds])
		for (const [id, arr] of rawByClient.entries()) {
			rawByClient.set(id, netDebtCrossCurrencyRows(arr, rates, symbols))
		}
		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...allCurrencyIds]))
		const out = new Map<string, ClientDebtByCurrency[]>()
		for (const row of rows) {
			const arr = rawByClient.get(row.id) ?? []
			out.set(row.id, withCurrencyBriefAmountMany(arr, currencyMap))
		}
		return out
	}

	private inReportPeriod(d: Date, start?: Date, end?: Date): boolean {
		if (!start && !end) return true
		const t = new Date(d).getTime()
		if (start && t < start.getTime()) return false
		if (end && t > end.getTime()) return false
		return true
	}

	private addToCurrencyMap(map: Map<string, Decimal>, currencyId: string, amount: Decimal) {
		map.set(currencyId, (map.get(currencyId) ?? new Decimal(0)).plus(amount))
	}

	private lineAggKey(kind: 'pm' | 'ch', type: string, currencyId: string) {
		return `${kind}|${type}|${currencyId}`
	}

	private addLinesToAgg(agg: Map<string, Decimal>, kind: 'pm' | 'ch', lines: Array<{ type: string; amount: Decimal; currencyId: string }>) {
		for (const m of lines) {
			const k = this.lineAggKey(kind, m.type, m.currencyId)
			agg.set(k, (agg.get(k) ?? new Decimal(0)).plus(m.amount))
		}
	}

	private aggKindToReportRows(agg: Map<string, Decimal>, kind: 'pm' | 'ch', currencyMap: Map<string, CurrencyBrief>): ClientReportPaymentRow[] {
		const prefix = `${kind}|`
		return Array.from(agg.entries())
			.filter(([key]) => key.startsWith(prefix))
			.map(([key, amount]) => {
				const rest = key.slice(prefix.length)
				const sep = rest.lastIndexOf('|')
				const rawType = rest.slice(0, sep)
				const currencyId = rest.slice(sep + 1)
				const type = kind === 'ch' ? `change:${rawType}` : rawType
				return withCurrencyBrief({ type, currencyId, amount }, currencyMap) as ClientReportPaymentRow
			})
	}

	private currencyTotalsFromMap(map: Map<string, Decimal>, currencyMap: Map<string, CurrencyBrief>): ClientReportCurrencyTotal[] {
		const rows = Array.from(map.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
		return withCurrencyBriefAmountMany(rows, currencyMap) as ClientReportCurrencyTotal[]
	}

	private collectReportCurrencyIds(
		sellings: Array<{
			date: Date
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: {
				createdAt: Date
				paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
				changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
			} | null
		}>,
		returnings: Array<{
			date: Date
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: {
				createdAt: Date
				paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
				changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
			} | null
		}>,
		payments: Array<{
			createdAt: Date
			paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
			changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
		}>,
		periodStart: Date | undefined,
		periodEnd: Date | undefined,
		into: Set<string>,
	) {
		const hasPeriod = !!(periodStart || periodEnd)
		const sellInPeriod = hasPeriod ? sellings.filter((s) => this.inReportPeriod(s.date, periodStart, periodEnd)) : sellings
		const retInPeriod = hasPeriod ? returnings.filter((r) => this.inReportPeriod(r.date, periodStart, periodEnd)) : returnings
		const payInPeriod = hasPeriod ? payments.filter((p) => this.inReportPeriod(p.createdAt, periodStart, periodEnd)) : payments

		for (const s of sellInPeriod) {
			for (const product of s.products) {
				for (const price of product.prices) into.add(price.currencyId)
			}
			if (s.payment && (!hasPeriod || this.inReportPeriod(s.payment.createdAt, periodStart, periodEnd))) {
				for (const m of s.payment.paymentMethods) into.add(m.currencyId)
				for (const m of s.payment.changeMethods ?? []) into.add(m.currencyId)
			}
		}
		for (const r of retInPeriod) {
			for (const product of r.products) {
				for (const price of product.prices) into.add(price.currencyId)
			}
			if (r.payment && (!hasPeriod || this.inReportPeriod(r.payment.createdAt, periodStart, periodEnd))) {
				for (const m of r.payment.paymentMethods) into.add(m.currencyId)
				for (const m of r.payment.changeMethods ?? []) into.add(m.currencyId)
			}
		}
		for (const p of payInPeriod) {
			for (const m of p.paymentMethods) into.add(m.currencyId)
			for (const m of p.changeMethods ?? []) into.add(m.currencyId)
		}
	}

	private buildClientReportSummary(
		sellings: Array<{
			date: Date
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: {
				createdAt: Date
				paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
				changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
			} | null
		}>,
		returnings: Array<{
			date: Date
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: {
				createdAt: Date
				paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
				changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
			} | null
		}>,
		payments: Array<{
			createdAt: Date
			paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
			changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
		}>,
		periodStart: Date | undefined,
		periodEnd: Date | undefined,
		currencyMap: Map<string, CurrencyBrief>,
	): ClientReportSummary {
		const hasPeriod = !!(periodStart || periodEnd)
		const sellInPeriod = hasPeriod ? sellings.filter((s) => this.inReportPeriod(s.date, periodStart, periodEnd)) : sellings
		const retInPeriod = hasPeriod ? returnings.filter((r) => this.inReportPeriod(r.date, periodStart, periodEnd)) : returnings
		const payInPeriod = hasPeriod ? payments.filter((p) => this.inReportPeriod(p.createdAt, periodStart, periodEnd)) : payments

		const sellingProductMap = new Map<string, Decimal>()
		for (const s of sellInPeriod) {
			for (const product of s.products) {
				for (const price of product.prices) {
					this.addToCurrencyMap(sellingProductMap, price.currencyId, price.totalPrice)
				}
			}
		}

		const sellingLineAgg = new Map<string, Decimal>()
		for (const s of sellInPeriod) {
			if (!s.payment) continue
			if (hasPeriod && !this.inReportPeriod(s.payment.createdAt, periodStart, periodEnd)) continue
			this.addLinesToAgg(sellingLineAgg, 'pm', s.payment.paymentMethods)
			this.addLinesToAgg(sellingLineAgg, 'ch', s.payment.changeMethods ?? [])
		}
		for (const p of payInPeriod) {
			this.addLinesToAgg(sellingLineAgg, 'pm', p.paymentMethods)
			this.addLinesToAgg(sellingLineAgg, 'ch', p.changeMethods ?? [])
		}

		const returningProductMap = new Map<string, Decimal>()
		for (const r of retInPeriod) {
			for (const product of r.products) {
				for (const price of product.prices) {
					this.addToCurrencyMap(returningProductMap, price.currencyId, price.totalPrice)
				}
			}
		}

		const returningLineAgg = new Map<string, Decimal>()
		for (const r of retInPeriod) {
			if (!r.payment) continue
			if (hasPeriod && !this.inReportPeriod(r.payment.createdAt, periodStart, periodEnd)) continue
			this.addLinesToAgg(returningLineAgg, 'pm', r.payment.paymentMethods)
			this.addLinesToAgg(returningLineAgg, 'ch', r.payment.changeMethods ?? [])
		}

		const period = hasPeriod ? { startDate: periodStart, endDate: periodEnd } : null

		return {
			period,
			selling: {
				documentsCount: sellInPeriod.length,
				productTotalsByCurrency: this.currencyTotalsFromMap(sellingProductMap, currencyMap),
				paymentMethods: this.aggKindToReportRows(sellingLineAgg, 'pm', currencyMap),
				changeMethods: this.aggKindToReportRows(sellingLineAgg, 'ch', currencyMap),
			},
			returning: {
				documentsCount: retInPeriod.length,
				productTotalsByCurrency: this.currencyTotalsFromMap(returningProductMap, currencyMap),
				paymentMethods: this.aggKindToReportRows(returningLineAgg, 'pm', currencyMap),
				changeMethods: this.aggKindToReportRows(returningLineAgg, 'ch', currencyMap),
			},
		}
	}

	async findMany(query: ClientFindManyRequest) {
		const clients = await this.clientRepository.findMany({ ...query, pagination: false })

		const currencyIdSet = new Set<string>()
		const mappedClientsPre = clients.map((c) => {
			const debtMap = this.calcDebtByCurrency(c.sellings, c.payments, c.returnings)
			for (const id of debtMap.keys()) currencyIdSet.add(id)
			const debtByCurrency: Array<{ currencyId: string; amount: Decimal }> = Array.from(debtMap.entries()).map(([currencyId, amount]) => ({
				currencyId,
				amount,
			}))

			return {
				id: c.id,
				fullname: c.fullname,
				phone: c.phone,
				telegram: c.telegram,
				createdAt: c.createdAt,
				debtByCurrency,
				lastSellingDate: c.sellings?.length ? c.sellings[0].date : null,
			}
		})

		const debtOnlyIds = new Set<string>()
		for (const m of mappedClientsPre) {
			for (const d of m.debtByCurrency) debtOnlyIds.add(d.currencyId)
		}
		const { rates, symbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...debtOnlyIds])

		const mappedClients = mappedClientsPre.map((m) => {
			const debtByCurrency = netDebtCrossCurrencyRows(m.debtByCurrency, rates, symbols)
			const totalDebt = debtByCurrency.reduce((a, b) => a.plus(b.amount), new Decimal(0))
			return { ...m, debtByCurrency, _totalDebt: totalDebt }
		})

		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIdSet]))
		const clientsWithDebtCurrency = mappedClients.map((row) => ({
			...row,
			debtByCurrency: withCurrencyBriefAmountMany(row.debtByCurrency, currencyMap),
		}))

		const filteredClients = clientsWithDebtCurrency.filter((c) => {
			if (query.debtType && query.debtValue !== undefined) {
				const value = new Decimal(query.debtValue)
				switch (query.debtType) {
					case DebtTypeEnum.gt:
						return c._totalDebt.gt(value)
					case DebtTypeEnum.lt:
						return c._totalDebt.lt(value)
					case DebtTypeEnum.eq:
						return c._totalDebt.eq(value)
					default:
						return true
				}
			}
			return true
		})

		const sortedClients = filteredClients.sort((a, b) => {
			const da = a.lastSellingDate ? new Date(a.lastSellingDate).getTime() : 0
			const db = b.lastSellingDate ? new Date(b.lastSellingDate).getTime() : 0
			return db - da
		})

		const paginatedClients = query.pagination
			? sortedClients.slice((query.pageNumber - 1) * query.pageSize, query.pageNumber * query.pageSize).map(({ _totalDebt, ...rest }) => rest)
			: sortedClients.map(({ _totalDebt, ...rest }) => rest)

		const result = query.pagination
			? {
					totalCount: sortedClients.length,
					pagesCount: Math.ceil(sortedClients.length / query.pageSize),
					pageSize: paginatedClients.length,
					data: paginatedClients,
				}
			: { data: paginatedClients }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ClientFindOneRequest) {
		const deedStartDate = query.deedStartDate ? new Date(new Date(query.deedStartDate).setHours(0, 0, 0, 0)) : undefined
		const deedEndDate = query.deedEndDate ? new Date(new Date(query.deedEndDate).setHours(23, 59, 59, 999)) : undefined

		const client = await this.clientRepository.findOne(query)

		if (!client) {
			throw new BadRequestException(ERROR_MSG.CLIENT.NOT_FOUND.UZ)
		}

		const deeds: ClientDeed[] = []
		const totalDebitMap = new Map<string, Decimal>()
		const totalCreditMap = new Map<string, Decimal>()

		const addToMap = (map: Map<string, Decimal>, currencyId: string, amount: Decimal) => {
			const curr = map.get(currencyId) ?? new Decimal(0)
			map.set(currencyId, curr.plus(amount))
		}

		for (const sel of client.sellings) {
			for (const product of sel.products) {
				for (const price of product.prices) {
					if ((!deedStartDate || sel.date >= deedStartDate) && (!deedEndDate || sel.date <= deedEndDate)) {
						deeds.push({
							type: 'debit',
							action: 'selling',
							value: price.totalPrice,
							date: sel.date,
							description: '',
							currencyId: price.currencyId,
							currency: price.currency,
						})
						addToMap(totalDebitMap, price.currencyId, price.totalPrice)
					}
				}
			}

			if (sel.payment) {
				const payDate = sel.payment.createdAt
				for (const method of sel.payment.paymentMethods) {
					if ((!deedStartDate || payDate >= deedStartDate) && (!deedEndDate || payDate <= deedEndDate)) {
						deeds.push({
							type: 'credit',
							action: 'payment',
							value: method.amount,
							date: payDate,
							description: sel.payment.description ?? '',
							currencyId: method.currencyId,
							currency: method.currency,
						})
						addToMap(totalCreditMap, method.currencyId, method.amount)
					}
				}
				for (const ch of sel.payment.changeMethods ?? []) {
					deeds.push({
						type: 'debit',
						action: 'change',
						value: ch.amount,
						date: payDate,
						description: sel.payment.description ?? '',
						currencyId: ch.currencyId,
						currency: ch.currency,
					})
					addToMap(totalDebitMap, ch.currencyId, ch.amount)
				}
			}
		}

		for (const returning of client.returnings) {
			// Returning product: credit (reduces what client owes)
			for (const product of returning.products) {
				for (const price of product.prices) {
					if ((!deedStartDate || returning.date >= deedStartDate) && (!deedEndDate || returning.date <= deedEndDate)) {
						deeds.push({
							type: 'credit',
							action: 'returning',
							value: price.totalPrice,
							date: returning.date,
							description: '',
							currencyId: price.currencyId,
							currency: price.currency,
						})
						addToMap(totalCreditMap, price.currencyId, price.totalPrice)
					}
				}
			}
			// Returning payment methods: debit (business settled, reverses the credit)
			if (returning.payment) {
				const payDate = returning.payment.createdAt
				for (const method of returning.payment.paymentMethods) {
					if ((!deedStartDate || payDate >= deedStartDate) && (!deedEndDate || payDate <= deedEndDate)) {
						deeds.push({
							type: 'debit',
							action: 'returning',
							value: method.amount,
							date: payDate,
							description: returning.payment.description ?? '',
							currencyId: method.currencyId,
							currency: method.currency,
						})
						addToMap(totalDebitMap, method.currencyId, method.amount)
					}
				}
				for (const ch of returning.payment.changeMethods ?? []) {
					if ((!deedStartDate || payDate >= deedStartDate) && (!deedEndDate || payDate <= deedEndDate)) {
						deeds.push({
							type: 'debit',
							action: 'returning',
							value: ch.amount,
							date: payDate,
							description: returning.payment.description ?? '',
							currencyId: ch.currencyId,
							currency: ch.currency,
						})
						addToMap(totalDebitMap, ch.currencyId, ch.amount)
					}
				}
			}
		}

		for (const payment of client.payments) {
			if ((!deedStartDate || payment.createdAt >= deedStartDate) && (!deedEndDate || payment.createdAt <= deedEndDate)) {
				for (const method of payment.paymentMethods) {
					deeds.push({
						type: 'credit',
						action: 'payment',
						value: method.amount,
						date: payment.createdAt,
						description: payment.description ?? '',
						currencyId: method.currencyId,
						currency: method.currency,
					})
					addToMap(totalCreditMap, method.currencyId, method.amount)
				}
				for (const ch of payment.changeMethods ?? []) {
					if (isChangeBalanceExcludedFromDebt(ch.type)) continue
					deeds.push({
						type: 'credit',
						action: 'payment',
						value: ch.amount,
						date: payment.createdAt,
						description: payment.description ?? '',
						currencyId: ch.currencyId,
						currency: ch.currency,
					})
					addToMap(totalCreditMap, ch.currencyId, ch.amount)
				}
			}
		}

		const filteredDeeds = deeds.filter((d) => !d.value.equals(0)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		const allCurrencies = new Set([...totalDebitMap.keys(), ...totalCreditMap.keys()])
		const debtByCurrencyMap = new Map<string, Decimal>()
		for (const currId of allCurrencies) {
			const debit = totalDebitMap.get(currId) ?? new Decimal(0)
			const credit = totalCreditMap.get(currId) ?? new Decimal(0)
			debtByCurrencyMap.set(currId, debit.minus(credit))
		}

		const deedCurrencyIds = new Set<string>([...totalCreditMap.keys(), ...totalDebitMap.keys(), ...debtByCurrencyMap.keys()])

		const fullDebtMap = this.calcDebtByCurrency(client.sellings, client.payments, client.returnings)
		for (const id of fullDebtMap.keys()) deedCurrencyIds.add(id)

		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...deedCurrencyIds]))

		const deedDebtRaw = Array.from(debtByCurrencyMap.entries())
			.filter(([, amount]) => !amount.isZero())
			.map(([currencyId, amount]) => ({ currencyId, amount }))
		const fullDebtRaw = Array.from(fullDebtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
		const allNetCurrencyIds = new Set<string>()
		for (const x of fullDebtRaw) allNetCurrencyIds.add(x.currencyId)
		for (const x of deedDebtRaw) allNetCurrencyIds.add(x.currencyId)
		const { rates: fullDebtRates, symbols: fullDebtSymbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...allNetCurrencyIds])
		const fullDebtNetted = netDebtCrossCurrencyRows(fullDebtRaw, fullDebtRates, fullDebtSymbols)
		const deedDebtNetted = netDebtCrossCurrencyRows(deedDebtRaw, fullDebtRates, fullDebtSymbols)

		const totalCreditByCurrency: ClientDebtByCurrency[] = withCurrencyBriefAmountMany(
			Array.from(totalCreditMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount })),
			currencyMap,
		).map((r) => ({ ...r, amount: roundDebtDecimal(r.amount) }))
		const totalDebitByCurrency: ClientDebtByCurrency[] = withCurrencyBriefAmountMany(
			Array.from(totalDebitMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount })),
			currencyMap,
		).map((r) => ({ ...r, amount: roundDebtDecimal(r.amount) }))
		const deedDebtByCurrency: ClientDebtByCurrency[] = withCurrencyBriefAmountMany(deedDebtNetted, currencyMap)

		const fullDebt: ClientDebtByCurrency[] = withCurrencyBriefAmountMany(fullDebtNetted, currencyMap)

		return createResponse({
			data: {
				id: client.id,
				fullname: client.fullname,
				phone: client.phone,
				createdAt: client.createdAt,
				updatedAt: client.updatedAt,
				deletedAt: client.deletedAt,
				debtByCurrency: fullDebt,
				deedInfo: {
					totalDebitByCurrency,
					totalCreditByCurrency,
					debtByCurrency: deedDebtByCurrency,
					deeds: filteredDeeds,
				},
				telegram: client.telegram,
				lastSellingDate: client.sellings?.length ? client.sellings[0].date : null,
			},
			success: { messages: ['find one success'] },
		})
	}

	async getMany(query: ClientGetManyRequest) {
		const clients = await this.clientRepository.getMany(query)
		const clientsCount = await this.clientRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(clientsCount / query.pageSize),
					pageSize: clients.length,
					data: clients,
				}
			: { data: clients }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ClientGetOneRequest) {
		const client = await this.clientRepository.getOne(query)

		if (!client) {
			throw new BadRequestException(ERROR_MSG.CLIENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: client, success: { messages: ['get one success'] } })
	}

	async createOne(body: ClientCreateOneRequest) {
		const candidate = await this.clientRepository.getOne({ phone: body.phone })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.CLIENT.PHONE_EXISTS.UZ)
		}

		const client = await this.clientRepository.createOne({ ...body })

		return createResponse({ data: client, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ClientGetOneRequest, body: ClientUpdateOneRequest) {
		await this.getOne(query)

		if (body.phone) {
			const candidate = await this.clientRepository.getOne({ phone: body.phone })
			if (candidate && candidate.id !== query.id) {
				throw new BadRequestException(ERROR_MSG.CLIENT.PHONE_EXISTS.UZ)
			}
		}

		await this.clientRepository.updateOne(query, { ...body })

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ClientDeleteOneRequest) {
		await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.clientRepository.deleteOne(query)
		} else {
			await this.clientRepository.updateOne(query, { deletedAt: new Date() })
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async findManyForReport(query: ClientFindManyRequest) {
		const clients = await this.clientRepository.findMany({ ...query, pagination: false })

		const periodStart = query.startDate ? new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) : undefined
		const periodEnd = query.endDate ? new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) : undefined

		const allCurrencyIds = new Set<string>()
		for (const c of clients) {
			const debtMap = this.calcDebtByCurrency(c.sellings, c.payments, c.returnings)
			for (const id of debtMap.keys()) allCurrencyIds.add(id)
			this.collectReportCurrencyIds(c.sellings, c.returnings, c.payments, periodStart, periodEnd, allCurrencyIds)
		}

		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...allCurrencyIds]))

		const mappedClientsPre = clients.map((c) => {
			const debtMap = this.calcDebtByCurrency(c.sellings, c.payments, c.returnings)
			const debtByCurrency = Array.from(debtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
			const report = this.buildClientReportSummary(c.sellings, c.returnings, c.payments, periodStart, periodEnd, currencyMap)

			return {
				id: c.id,
				fullname: c.fullname,
				phone: c.phone,
				telegram: c.telegram,
				createdAt: c.createdAt,
				debtByCurrency,
				lastSellingDate: c.sellings?.length ? c.sellings[0].date : null,
				report,
			}
		})

		const reportDebtIds = new Set<string>()
		for (const m of mappedClientsPre) {
			for (const d of m.debtByCurrency) reportDebtIds.add(d.currencyId)
		}
		const { rates: reportRates, symbols: reportSymbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...reportDebtIds])

		const mappedClients = mappedClientsPre.map((m) => {
			const debtByCurrency = netDebtCrossCurrencyRows(m.debtByCurrency, reportRates, reportSymbols)
			const totalDebt = debtByCurrency.reduce((a, b) => a.plus(b.amount), new Decimal(0))
			return { ...m, debtByCurrency, _totalDebt: totalDebt }
		})

		const clientsWithDebtCurrency = mappedClients.map((row) => ({
			...row,
			debtByCurrency: withCurrencyBriefAmountMany(row.debtByCurrency, currencyMap),
		}))

		const filteredClients = clientsWithDebtCurrency.filter((c) => {
			if (query.debtType && query.debtValue !== undefined) {
				const value = new Decimal(query.debtValue)
				switch (query.debtType) {
					case DebtTypeEnum.gt:
						return c._totalDebt.gt(value)
					case DebtTypeEnum.lt:
						return c._totalDebt.lt(value)
					case DebtTypeEnum.eq:
						return c._totalDebt.eq(value)
					default:
						return true
				}
			}
			return true
		})

		const sortedClients = filteredClients.sort((a, b) => {
			const da = a.lastSellingDate ? new Date(a.lastSellingDate).getTime() : 0
			const db = b.lastSellingDate ? new Date(b.lastSellingDate).getTime() : 0
			return db - da
		})

		const paginatedClients = query.pagination
			? sortedClients.slice((query.pageNumber - 1) * query.pageSize, query.pageNumber * query.pageSize).map(({ _totalDebt, ...rest }) => rest)
			: sortedClients.map(({ _totalDebt, ...rest }) => rest)

		const result = query.pagination
			? {
					totalCount: sortedClients.length,
					pagesCount: Math.ceil(sortedClients.length / query.pageSize),
					pageSize: paginatedClients.length,
					data: paginatedClients,
				}
			: { data: paginatedClients }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async excelDownloadMany(res: Response, query: ClientFindManyRequest) {
		return await this.excelService.clientDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: ClientFindOneRequest) {
		return await this.excelService.clientDeedDownloadOne(res, query)
	}

	async excelWithProductDownloadOne(res: Response, query: ClientFindOneRequest) {
		return await this.excelService.clientDeedWithProductDownloadOne(res, query)
	}
}
