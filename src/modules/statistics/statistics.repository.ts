import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import { StatisticsGetAllProductMVRequest, StatisticsGetSellingPeriodStatsRequest, ProductMVStatsTypeEnum, StatisticsClientReportRequest } from './interfaces'
import { ClientReportByCurrency, ClientReportCalc, ClientReportRow } from './interfaces/response.interfaces'
import { StatsTypeEnum } from '../selling/enums'

import { PaymentMethodEnum, SellingStatusEnum } from '@prisma/client'
import { convertUTCtoLocal, currencyBriefMapFromRows, extractDateParts, withCurrencyBriefAmountMany } from '@common'
import { Decimal } from '@prisma/client/runtime/library'
import { CurrencyRepository } from '../currency'

type CurrencyMap = Map<string, Decimal>

interface InternalCalc {
	selling: { count: number; priceMap: CurrencyMap; paymentCount: number; paymentMap: CurrencyMap }
	clientPayment: { count: number; paymentMap: CurrencyMap }
	returning: { count: number; paymentMap: CurrencyMap }
}

const PRICES_SELECT = { id: true, type: true, price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true, id: true } } }

const SELLING_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { select: PRICES_SELECT },
	product: { select: { id: true, name: true, createdAt: true } },
	staff: { select: { id: true, fullname: true } },
	selling: { select: { publicId: true, id: true, date: true, status: true, client: { select: { id: true, fullname: true, phone: true } } } },
}

const ARRIVAL_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { select: PRICES_SELECT },
	product: { select: { id: true, name: true, createdAt: true } },
	staff: { select: { id: true, fullname: true } },
	arrival: { select: { id: true, date: true, supplier: { select: { id: true, fullname: true, phone: true } } } },
}

const RETURNING_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { select: PRICES_SELECT },
	product: { select: { id: true, name: true, createdAt: true } },
	staff: { select: { id: true, fullname: true } },
	returning: { select: { id: true, date: true, status: true, client: { select: { id: true, fullname: true, phone: true } } } },
}

@Injectable()
export class StatisticsRepository {
	constructor(
		private readonly prisma: PrismaService,
		private readonly currencyRepository: CurrencyRepository,
	) {}

	private enrichClientReportRow(row: ClientReportRow, map: ReturnType<typeof currencyBriefMapFromRows>): ClientReportRow {
		const enrich = (arr: Array<{ currencyId: string; amount: Decimal }>) => withCurrencyBriefAmountMany(arr, map)
		return {
			...row,
			calc: {
				selling: {
					...row.calc.selling,
					totalPriceByCurrency: enrich(row.calc.selling.totalPriceByCurrency),
					paymentByCurrency: enrich(row.calc.selling.paymentByCurrency),
				},
				clientPayment: {
					...row.calc.clientPayment,
					totalByCurrency: enrich(row.calc.clientPayment.totalByCurrency),
				},
				returning: {
					...row.calc.returning,
					paymentByCurrency: enrich(row.calc.returning.paymentByCurrency),
				},
				debtByCurrency: enrich(row.calc.debtByCurrency),
			},
		}
	}

	// ─── Selling Stats ─────────────────────────────────────────────────────────

	private groupTotalsByCurrency(totals: { total: Decimal; currency: { id: string; symbol: string } }[]) {
		const map = new Map<string, { currencyId: string; symbol: string; total: Decimal }>()
		for (const t of totals) {
			const existing = map.get(t.currency.id)
			if (existing) {
				existing.total = existing.total.plus(t.total)
			} else {
				map.set(t.currency.id, { currencyId: t.currency.id, symbol: t.currency.symbol, total: new Decimal(t.total) })
			}
		}
		return Array.from(map.values())
	}

	private async getTotalsByCurrencyForPeriod(start: Date, end: Date) {
		const prices = await this.prisma.sellingProductMVPriceModel.findMany({
			where: {
				productMV: {
					selling: { status: SellingStatusEnum.accepted, createdAt: { gte: start, lte: end } },
				},
			},
			select: { totalPrice: true, currency: { select: { id: true, symbol: true } } },
		})
		return this.groupTotalsByCurrency(prices.map((p) => ({ total: p.totalPrice, currency: p.currency })))
	}

	private async getDayStats() {
		const now = convertUTCtoLocal(new Date())
		const extracted = extractDateParts(now)
		const result = []
		for (let hour = 0; hour <= now.getHours(); hour++) {
			const start = convertUTCtoLocal(new Date(extracted.year, extracted.month, extracted.day, hour, 0, 0, 0))
			const end = convertUTCtoLocal(new Date(extracted.year, extracted.month, extracted.day, hour, 59, 59, 999))
			const sums = await this.getTotalsByCurrencyForPeriod(start, end)
			const s = extractDateParts(start)
			result.push({ date: `${String(s.hour).padStart(2, '0')}:${String(s.minute).padStart(2, '0')}`, sums })
		}
		return result
	}

	private async getWeekStats() {
		const now = convertUTCtoLocal(new Date())
		const extracted = extractDateParts(now)
		const result = []
		for (let d = 6; d >= 0; d--) {
			const dayStart = convertUTCtoLocal(new Date(extracted.year, extracted.month, extracted.day - d, 0, 0, 0, 0))
			const dayEnd = convertUTCtoLocal(new Date(extracted.year, extracted.month, extracted.day - d, 23, 59, 59, 999))
			const sums = await this.getTotalsByCurrencyForPeriod(dayStart, dayEnd)
			result.push({ date: `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`, sums })
		}
		return result
	}

	private async getMonthStats() {
		const now = new Date()
		const result = []
		for (let day = 1; day <= now.getDate(); day++) {
			const dayStart = new Date(now.getFullYear(), now.getMonth(), day, 0, 0, 0, 0)
			const dayEnd = new Date(now.getFullYear(), now.getMonth(), day, 23, 59, 59, 999)
			const sums = await this.getTotalsByCurrencyForPeriod(dayStart, dayEnd)
			result.push({ date: dayStart.toISOString().split('T')[0], sums })
		}
		return result
	}

	private async getYearStats() {
		const now = new Date()
		const result = []
		for (let month = 0; month < 12; month++) {
			const monthStart = new Date(now.getFullYear(), month, 1, 0, 0, 0, 0)
			const monthEnd = new Date(now.getFullYear(), month + 1, 0, 23, 59, 59, 999)
			const sums = await this.getTotalsByCurrencyForPeriod(monthStart, monthEnd)
			result.push({ date: monthStart.toISOString().split('T')[0].slice(0, 7), sums })
		}
		return result
	}

	async getSellingPeriodStats(query: StatisticsGetSellingPeriodStatsRequest) {
		if (query.type === StatsTypeEnum.day) return this.getDayStats()
		if (query.type === StatsTypeEnum.week) return this.getWeekStats()
		if (query.type === StatsTypeEnum.month) return this.getMonthStats()
		if (query.type === StatsTypeEnum.year) return this.getYearStats()
		return this.getDayStats()
	}

	async getSellingTotalStats() {
		const [daily, weekly, monthly, yearly] = await Promise.all([this.getDayStats(), this.getWeekStats(), this.getMonthStats(), this.getYearStats()])
		return { daily, weekly, monthly, yearly }
	}

	// ─── All Product MV (cross-module) ─────────────────────────────────────────

	async findManyAllProductMV(query: StatisticsGetAllProductMVRequest) {
		const dateFilter = { gte: query.startDate, lte: query.endDate }
		const take = query.pagination ? query.pageSize : undefined
		const skip = query.pagination ? (query.pageNumber - 1) * query.pageSize : undefined

		if (query.type === ProductMVStatsTypeEnum.selling) {
			const items = await this.prisma.sellingProductMVModel.findMany({
				where: { sellingId: query.sellingId, productId: query.productId, staffId: query.staffId, createdAt: dateFilter },
				select: SELLING_MV_SELECT,
				orderBy: { createdAt: 'desc' },
				take,
				skip,
			})
			return items.map((i) => ({ ...i, type: ProductMVStatsTypeEnum.selling }))
		}

		if (query.type === ProductMVStatsTypeEnum.arrival) {
			const items = await this.prisma.arrivalProductMVModel.findMany({
				where: { arrivalId: query.arrivalId, productId: query.productId, staffId: query.staffId, createdAt: dateFilter },
				select: ARRIVAL_MV_SELECT,
				orderBy: { createdAt: 'desc' },
				take,
				skip,
			})
			return items.map((i) => ({ ...i, type: ProductMVStatsTypeEnum.arrival }))
		}

		if (query.type === ProductMVStatsTypeEnum.returning) {
			const items = await this.prisma.returningProductMVModel.findMany({
				where: { returningId: query.returningId, productId: query.productId, staffId: query.staffId, createdAt: dateFilter },
				select: RETURNING_MV_SELECT,
				orderBy: { createdAt: 'desc' },
				take,
				skip,
			})
			return items.map((i) => ({ ...i, type: ProductMVStatsTypeEnum.returning }))
		}

		// No type filter: query all 3 tables (accepted only) and combine
		const [sellingItems, arrivalItems, returningItems] = await Promise.all([
			this.prisma.sellingProductMVModel.findMany({
				where: {
					productId: query.productId,
					staffId: query.staffId,
					createdAt: dateFilter,
					selling: { status: SellingStatusEnum.accepted },
				},
				select: SELLING_MV_SELECT,
			}),
			this.prisma.arrivalProductMVModel.findMany({
				where: { productId: query.productId, staffId: query.staffId, createdAt: dateFilter },
				select: ARRIVAL_MV_SELECT,
			}),
			this.prisma.returningProductMVModel.findMany({
				where: {
					productId: query.productId,
					staffId: query.staffId,
					createdAt: dateFilter,
					returning: { status: SellingStatusEnum.accepted },
				},
				select: RETURNING_MV_SELECT,
			}),
		])

		const combined = [
			...sellingItems.map((i) => ({ ...i, type: ProductMVStatsTypeEnum.selling })),
			...arrivalItems.map((i) => ({ ...i, type: ProductMVStatsTypeEnum.arrival })),
			...returningItems.map((i) => ({ ...i, type: ProductMVStatsTypeEnum.returning })),
		].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

		return combined
	}

	async findManyProductStats(query: StatisticsGetAllProductMVRequest) {
		const [sellingMVs, arrivalMVs, returningMVs] = await Promise.all([
			this.prisma.sellingProductMVModel.findMany({
				where: {
					productId: query.productId,
					staffId: query.staffId,
					selling: { status: SellingStatusEnum.accepted },
				},
				select: { productId: true, count: true, product: { select: { id: true, name: true, count: true } } },
			}),
			this.prisma.arrivalProductMVModel.findMany({
				where: { productId: query.productId, staffId: query.staffId },
				select: { productId: true, count: true, product: { select: { id: true, name: true, count: true } } },
			}),
			this.prisma.returningProductMVModel.findMany({
				where: {
					productId: query.productId,
					staffId: query.staffId,
					returning: { status: SellingStatusEnum.accepted },
				},
				select: { productId: true, count: true, product: { select: { id: true, name: true, count: true } } },
			}),
		])

		const productMap = new Map<
			string,
			{ id: string; name: string; count: number; totalSellingCount: Decimal; totalArrivalCount: Decimal; totalReturningCount: Decimal; actualCount: Decimal }
		>()

		for (const mv of arrivalMVs) {
			const entry = productMap.get(mv.productId) ?? {
				id: mv.productId,
				name: mv.product.name,
				count: mv.product.count,
				totalSellingCount: new Decimal(0),
				totalArrivalCount: new Decimal(0),
				totalReturningCount: new Decimal(0),
				actualCount: new Decimal(0),
			}
			entry.totalArrivalCount = entry.totalArrivalCount.plus(mv.count)
			entry.actualCount = entry.actualCount.plus(mv.count)
			productMap.set(mv.productId, entry)
		}

		for (const mv of returningMVs) {
			const entry = productMap.get(mv.productId) ?? {
				id: mv.productId,
				name: mv.product.name,
				count: mv.product.count,
				totalSellingCount: new Decimal(0),
				totalArrivalCount: new Decimal(0),
				totalReturningCount: new Decimal(0),
				actualCount: new Decimal(0),
			}
			entry.totalReturningCount = entry.totalReturningCount.plus(mv.count)
			entry.actualCount = entry.actualCount.plus(mv.count)
			productMap.set(mv.productId, entry)
		}

		for (const mv of sellingMVs) {
			const entry = productMap.get(mv.productId) ?? {
				id: mv.productId,
				name: mv.product.name,
				count: mv.product.count,
				totalSellingCount: new Decimal(0),
				totalArrivalCount: new Decimal(0),
				totalReturningCount: new Decimal(0),
				actualCount: new Decimal(0),
			}
			entry.totalSellingCount = entry.totalSellingCount.plus(mv.count)
			entry.actualCount = entry.actualCount.minus(mv.count)
			productMap.set(mv.productId, entry)
		}

		return Array.from(productMap.values())
	}

	async countFindManyAllProductMV(query: StatisticsGetAllProductMVRequest) {
		if (query.type === ProductMVStatsTypeEnum.selling) {
			return this.prisma.sellingProductMVModel.count({
				where: { sellingId: query.sellingId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
			})
		}
		if (query.type === ProductMVStatsTypeEnum.arrival) {
			return this.prisma.arrivalProductMVModel.count({
				where: { arrivalId: query.arrivalId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
			})
		}
		if (query.type === ProductMVStatsTypeEnum.returning) {
			return this.prisma.returningProductMVModel.count({
				where: { returningId: query.returningId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
			})
		}
		const [s, a, r] = await Promise.all([
			this.prisma.sellingProductMVModel.count({ where: { productId: query.productId, staffId: query.staffId, selling: { status: SellingStatusEnum.accepted } } }),
			this.prisma.arrivalProductMVModel.count({ where: { productId: query.productId, staffId: query.staffId } }),
			this.prisma.returningProductMVModel.count({ where: { productId: query.productId, staffId: query.staffId, returning: { status: SellingStatusEnum.accepted } } }),
		])
		return s + a + r
	}

	// ─── Client Report ─────────────────────────────────────────────────────────

	async findManyClientReport(query: StatisticsClientReportRequest): Promise<{ data: ClientReportRow[]; totalCount?: number; pagesCount?: number; pageSize?: number }> {
		const dateFilter = query.startDate || query.endDate ? { gte: query.startDate, lte: query.endDate } : undefined
		const searchWhere = query.search
			? { OR: [{ fullname: { contains: query.search, mode: 'insensitive' as const } }, { phone: { contains: query.search, mode: 'insensitive' as const } }] }
			: {}

		// 1. Get all clients (sorted by latest selling date desc)
		const clients = await this.prisma.clientModel.findMany({
			where: { deletedAt: null, ...searchWhere },
			select: { id: true, fullname: true, phone: true, createdAt: true, telegram: { select: { id: true } } },
			orderBy: { createdAt: 'desc' },
		})

		// 2. Selling stats: count + selling price totals + payment totals
		const sellings = await this.prisma.sellingModel.findMany({
			where: { status: SellingStatusEnum.accepted, ...(dateFilter && { date: dateFilter }) },
			select: {
				clientId: true,
				products: {
					select: {
						prices: {
							where: { type: 'selling' },
							select: { currencyId: true, totalPrice: true },
						},
					},
				},
				payment: {
					select: {
						methods: { select: { type: true, currencyId: true, amount: true } },
					},
				},
			},
		})

		// 3. Standalone client payments
		const clientPayments = await this.prisma.clientPaymentModel.findMany({
			where: { deletedAt: null, ...(dateFilter && { createdAt: dateFilter }) },
			select: {
				clientId: true,
				methods: { select: { type: true, currencyId: true, amount: true } },
			},
		})

		// 4. Returnings + payment totals
		const returnings = await this.prisma.returningModel.findMany({
			where: { status: SellingStatusEnum.accepted, ...(dateFilter && { date: dateFilter }) },
			select: {
				clientId: true,
				payment: {
					select: {
						methods: { select: { type: true, currencyId: true, amount: true } },
					},
				},
			},
		})

		// 5. Build per-client aggregation map
		const calcMap = new Map<string, InternalCalc>()

		const getCalc = (clientId: string): InternalCalc => {
			if (!calcMap.has(clientId)) {
				calcMap.set(clientId, {
					selling: { count: 0, priceMap: new Map(), paymentCount: 0, paymentMap: new Map() },
					clientPayment: { count: 0, paymentMap: new Map() },
					returning: { count: 0, paymentMap: new Map() },
				})
			}
			return calcMap.get(clientId)
		}

		const addToCurrencyMap = (map: CurrencyMap, currencyId: string, amount: Decimal) => {
			map.set(currencyId, (map.get(currencyId) ?? new Decimal(0)).plus(amount))
		}

		for (const sel of sellings) {
			const c = getCalc(sel.clientId)
			c.selling.count += 1
			for (const product of sel.products) {
				for (const price of product.prices) {
					addToCurrencyMap(c.selling.priceMap, price.currencyId, price.totalPrice)
				}
			}
			if (sel.payment) {
				c.selling.paymentCount += 1
				for (const method of sel.payment.methods) {
					if (method.type === PaymentMethodEnum.fromCash || method.type === PaymentMethodEnum.fromBalance) continue
					addToCurrencyMap(c.selling.paymentMap, method.currencyId, method.amount)
				}
			}
		}

		for (const payment of clientPayments) {
			const c = getCalc(payment.clientId)
			c.clientPayment.count += 1
			for (const method of payment.methods) {
				if (method.type === PaymentMethodEnum.fromCash || method.type === PaymentMethodEnum.fromBalance) continue
				addToCurrencyMap(c.clientPayment.paymentMap, method.currencyId, method.amount)
			}
		}

		for (const returning of returnings) {
			const c = getCalc(returning.clientId)
			c.returning.count += 1
			if (returning.payment) {
				for (const method of returning.payment.methods) {
					if (method.type === PaymentMethodEnum.fromCash || method.type === PaymentMethodEnum.fromBalance) continue
					addToCurrencyMap(c.returning.paymentMap, method.currencyId, method.amount)
				}
			}
		}

		// 6. Convert to response rows (currency filled properly in step 7)
		const toArr = (map: CurrencyMap): ClientReportByCurrency[] =>
			Array.from(map.entries()).map(([currencyId, amount]) => ({
				currencyId,
				amount,
				currency: { id: currencyId, name: '', symbol: '' },
			}))

		const rows: ClientReportRow[] = clients.map((client) => {
			const raw = calcMap.get(client.id)
			if (!raw) {
				return {
					...client,
					calc: {
						selling: { count: 0, totalPriceByCurrency: [], paymentCount: 0, paymentByCurrency: [] },
						clientPayment: { count: 0, totalByCurrency: [] },
						returning: { count: 0, paymentByCurrency: [] },
						debtByCurrency: [],
					},
				}
			}

			// debt = sellingTotal - sellingPayment - clientPayment + returningPayment
			const debtMap = new Map<string, Decimal>()
			for (const [cId, v] of raw.selling.priceMap) debtMap.set(cId, (debtMap.get(cId) ?? new Decimal(0)).plus(v))
			for (const [cId, v] of raw.selling.paymentMap) debtMap.set(cId, (debtMap.get(cId) ?? new Decimal(0)).minus(v))
			for (const [cId, v] of raw.clientPayment.paymentMap) debtMap.set(cId, (debtMap.get(cId) ?? new Decimal(0)).minus(v))
			for (const [cId, v] of raw.returning.paymentMap) debtMap.set(cId, (debtMap.get(cId) ?? new Decimal(0)).minus(v))

			const calc: ClientReportCalc = {
				selling: {
					count: raw.selling.count,
					totalPriceByCurrency: toArr(raw.selling.priceMap),
					paymentCount: raw.selling.paymentCount,
					paymentByCurrency: toArr(raw.selling.paymentMap),
				},
				clientPayment: {
					count: raw.clientPayment.count,
					totalByCurrency: toArr(raw.clientPayment.paymentMap),
				},
				returning: {
					count: raw.returning.count,
					paymentByCurrency: toArr(raw.returning.paymentMap),
				},
				debtByCurrency: toArr(debtMap),
			}

			return { ...client, calc }
		})

		const currencyIdSet = new Set<string>()
		for (const row of rows) {
			const c = row.calc
			for (const x of c.selling.totalPriceByCurrency) currencyIdSet.add(x.currencyId)
			for (const x of c.selling.paymentByCurrency) currencyIdSet.add(x.currencyId)
			for (const x of c.clientPayment.totalByCurrency) currencyIdSet.add(x.currencyId)
			for (const x of c.returning.paymentByCurrency) currencyIdSet.add(x.currencyId)
			for (const x of c.debtByCurrency) currencyIdSet.add(x.currencyId)
		}
		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIdSet]))
		const enrichedRows = rows.map((row) => this.enrichClientReportRow(row, currencyMap))

		if (query.pagination) {
			const totalCount = enrichedRows.length
			const pagesCount = Math.ceil(totalCount / query.pageSize)
			const pageSize = query.pageSize
			const data = enrichedRows.slice((query.pageNumber - 1) * pageSize, query.pageNumber * pageSize)
			return { data, totalCount, pagesCount, pageSize: data.length }
		}

		return { data: enrichedRows }
	}
}
