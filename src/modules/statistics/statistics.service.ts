import { Injectable } from '@nestjs/common'
import { StatisticsRepository } from './statistics.repository'
import { createResponse, currencyBriefMapFromRows } from '@common'
import {
	StatisticsGetAllProductMVRequest,
	StatisticsGetSellingPeriodStatsRequest,
	StatisticsGetSellingTotalStatsRequest,
	StatisticsClientReportRequest,
	StatisticsDashboardSummaryRequest,
} from './interfaces'
import type { StatsPeriodEntry } from './interfaces/response.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PrismaService } from '../shared/prisma'
import { ClientService } from '../client'
import { SupplierService } from '../supplier'
import { CurrencyRepository } from '../currency'

@Injectable()
export class StatisticsService {
	private readonly debtChunkSize = 300

	constructor(
		private readonly statisticsRepository: StatisticsRepository,
		private readonly prisma: PrismaService,
		private readonly clientService: ClientService,
		private readonly supplierService: SupplierService,
		private readonly currencyRepository: CurrencyRepository,
	) {}

	async getSellingPeriodStats(query: StatisticsGetSellingPeriodStatsRequest) {
		const result = await this.statisticsRepository.getSellingPeriodStats(query)
		const enriched = await this.enrichPeriodStatsWithCurrencyNames(result)
		return createResponse({ data: enriched, success: { messages: ['get period stats success'] } })
	}

	async getSellingTotalStats(_query: StatisticsGetSellingTotalStatsRequest) {
		const raw = await this.statisticsRepository.getSellingTotalStats()
		const [clientDebtByCurrency, supplierDebtByCurrency] = await Promise.all([this.buildClientDebtTotalsByCurrency(), this.buildSupplierDebtTotalsByCurrency()])

		const currencyIds = new Set<string>()
		for (const bucket of [raw.daily, raw.weekly, raw.monthly, raw.yearly] as StatsPeriodEntry[][]) {
			for (const e of bucket) {
				for (const r of e.byCurrency) currencyIds.add(r.currencyId)
			}
		}
		for (const r of clientDebtByCurrency) currencyIds.add(r.currencyId)
		for (const r of supplierDebtByCurrency) currencyIds.add(r.currencyId)

		const briefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIds]))
		const enrichRows = <T extends { currencyId: string; currency: { id: string; name: string; symbol: string } }>(rows: T[]) =>
			rows.map((r) => ({ ...r, currency: briefMap.get(r.currencyId) ?? r.currency }))

		const enrichPeriod = (period: StatsPeriodEntry[]) =>
			period.map((entry) => ({
				...entry,
				byCurrency: enrichRows(entry.byCurrency),
			}))

		const data = {
			daily: enrichPeriod(raw.daily),
			weekly: enrichPeriod(raw.weekly),
			monthly: enrichPeriod(raw.monthly),
			yearly: enrichPeriod(raw.yearly),
			clientDebtByCurrency: enrichRows(clientDebtByCurrency),
			supplierDebtByCurrency: enrichRows(supplierDebtByCurrency),
		}

		return createResponse({ data, success: { messages: ['get total stats success'] } })
	}

	private async enrichPeriodStatsWithCurrencyNames(period: StatsPeriodEntry[]): Promise<StatsPeriodEntry[]> {
		const ids = new Set<string>()
		for (const e of period) {
			for (const r of e.byCurrency) ids.add(r.currencyId)
		}
		if (ids.size === 0) return period
		const briefMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...ids]))
		return period.map((entry) => ({
			...entry,
			byCurrency: entry.byCurrency.map((r) => ({
				...r,
				currency: briefMap.get(r.currencyId) ?? r.currency,
			})),
		}))
	}

	/** Mijozlar joriy qarzi: valyuta bo‘yicha (musbat = debitor, manfiy modul = kreditor) */
	private async buildClientDebtTotalsByCurrency() {
		const ids = (await this.prisma.clientModel.findMany({ where: { deletedAt: null }, select: { id: true } })).map((c) => c.id)
		const agg = new Map<string, { theirDebt: Decimal; ourDebt: Decimal }>()
		for (let i = 0; i < ids.length; i += this.debtChunkSize) {
			const slice = ids.slice(i, i + this.debtChunkSize)
			const snap = await this.clientService.getDebtSnapshotsByClientIds(slice)
			for (const rows of snap.values()) {
				for (const row of rows) {
					const cur = agg.get(row.currencyId) ?? { theirDebt: new Decimal(0), ourDebt: new Decimal(0) }
					if (row.amount.gt(0)) {
						cur.theirDebt = cur.theirDebt.plus(row.amount)
					} else if (row.amount.lt(0)) {
						cur.ourDebt = cur.ourDebt.plus(row.amount.abs())
					}
					agg.set(row.currencyId, cur)
				}
			}
		}
		return [...agg.entries()].map(([currencyId, v]) => ({
			currencyId,
			theirDebt: v.theirDebt,
			ourDebt: v.ourDebt,
			currency: { id: currencyId, name: '', symbol: '' },
		}))
	}

	/** Ta’minotchilar: musbat qarz = bizga qarz (ourDebt), manfiy = ular bizga (theirDebt) */
	private async buildSupplierDebtTotalsByCurrency() {
		const ids = (await this.prisma.supplierModel.findMany({ where: { deletedAt: null }, select: { id: true } })).map((s) => s.id)
		const agg = new Map<string, { theirDebt: Decimal; ourDebt: Decimal }>()
		for (let i = 0; i < ids.length; i += this.debtChunkSize) {
			const slice = ids.slice(i, i + this.debtChunkSize)
			const snap = await this.supplierService.getDebtSnapshotsBySupplierIds(slice)
			for (const rows of snap.values()) {
				for (const row of rows) {
					const cur = agg.get(row.currencyId) ?? { theirDebt: new Decimal(0), ourDebt: new Decimal(0) }
					if (row.amount.gt(0)) {
						cur.ourDebt = cur.ourDebt.plus(row.amount)
					} else if (row.amount.lt(0)) {
						cur.theirDebt = cur.theirDebt.plus(row.amount.abs())
					}
					agg.set(row.currencyId, cur)
				}
			}
		}
		return [...agg.entries()].map(([currencyId, v]) => ({
			currencyId,
			ourDebt: v.ourDebt,
			theirDebt: v.theirDebt,
			currency: { id: currencyId, name: '', symbol: '' },
		}))
	}

	async findManyAllProductMV(query: StatisticsGetAllProductMVRequest) {
		const items = await this.statisticsRepository.findManyAllProductMV(query)
		const count = await this.statisticsRepository.countFindManyAllProductMV(query)

		const result = query.pagination ? { totalCount: count, pagesCount: Math.ceil(count / query.pageSize), pageSize: items.length, data: items } : { data: items }

		return createResponse({ data: result, success: { messages: ['find many product mv success'] } })
	}

	async findManyProductStats(query: StatisticsGetAllProductMVRequest) {
		const products = await this.statisticsRepository.findManyProductStats(query)
		return createResponse({ data: products, success: { messages: ['find many product stats success'] } })
	}

	async findManyClientReport(query: StatisticsClientReportRequest) {
		const result = await this.statisticsRepository.findManyClientReport(query)
		return createResponse({ data: result, success: { messages: ['find many client report success'] } })
	}

	async getDashboardSummary(query: StatisticsDashboardSummaryRequest) {
		const data = await this.statisticsRepository.getDashboardSummary(query)
		return createResponse({ data, success: { messages: ['get dashboard summary success'] } })
	}
}
