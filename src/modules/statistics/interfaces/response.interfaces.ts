import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface StatsCurrencyEntry {
	currencyId: string
	total: Decimal
	/** Valyuta qisqacha (nom, belgi) */
	currency: CurrencyBrief
}

export declare interface StatsPeriodEntry {
	date: string
	/** Shu davr uchun sotuv summasi valyuta bo‘yicha */
	byCurrency: StatsCurrencyEntry[]
}

/** Joriy holat: mijozlar bo‘yicha valyutada debitor/kreditor yig‘indisi */
export declare interface StatisticsTotalStatsClientDebtRow {
	currencyId: string
	/** Mijoz bizga qarzdor (musbat qarz) */
	theirDebt: Decimal
	/** Biz mijozga qarzdor (manfiy qarzning moduli) */
	ourDebt: Decimal
	currency: CurrencyBrief
}

/** Joriy holat: ta’minotchilar bo‘yicha */
export declare interface StatisticsTotalStatsSupplierDebtRow {
	currencyId: string
	/** Biz ta’minotchiga qarzdor (musbat balans) */
	ourDebt: Decimal
	/** Ta’minotchi bizga qarzdor */
	theirDebt: Decimal
	currency: CurrencyBrief
}

export declare interface StatisticsGetSellingPeriodStatsResponse extends GlobalResponse {
	data: StatsPeriodEntry[]
}

export declare interface StatisticsGetSellingTotalStatsResponse extends GlobalResponse {
	data: {
		/** Bugungi kun (00:00–23:59, lokal) — valyuta bo‘yicha yig‘indi */
		dailyByCurrency: StatsCurrencyEntry[]
		/** Joriy “hafta” oynasi: bugundan 6 kun oldingi kun 00:00 — bugun 23:59 (bitta yig‘indi) */
		weeklyByCurrency: StatsCurrencyEntry[]
		/** Joriy oy: oy boshidan bugungacha */
		monthlyByCurrency: StatsCurrencyEntry[]
		/** Joriy yil: 1-yanvardan bugungacha */
		yearlyByCurrency: StatsCurrencyEntry[]
		clientDebtByCurrency: StatisticsTotalStatsClientDebtRow[]
		supplierDebtByCurrency: StatisticsTotalStatsSupplierDebtRow[]
	}
}

export declare interface StatisticsGetAllProductMVResponse extends GlobalResponse {
	data: any
}

export declare interface ClientReportByCurrency {
	currencyId: string
	amount: Decimal
	currency: CurrencyBrief
}

export declare interface ClientReportCalc {
	selling: {
		count: number
		totalPriceByCurrency: ClientReportByCurrency[]
		paymentCount: number
		paymentByCurrency: ClientReportByCurrency[]
	}
	clientPayment: {
		count: number
		totalByCurrency: ClientReportByCurrency[]
	}
	returning: {
		count: number
		paymentByCurrency: ClientReportByCurrency[]
	}
	debtByCurrency: ClientReportByCurrency[]
}

export declare interface ClientReportRow {
	id: string
	fullname: string
	phone: string
	createdAt: Date
	telegram?: { id?: string } | null
	calc: ClientReportCalc
}

export declare interface StatisticsClientReportResponse extends GlobalResponse {
	data: PaginationResponse<ClientReportRow> | { data: ClientReportRow[] }
}

export declare interface DashboardSummaryBlock<T = ClientReportByCurrency[]> {
	totalsByCurrency: T
	count: number
}

export declare interface StatisticsDashboardSummaryData {
	selling: {
		profitByCurrency: ClientReportByCurrency[]
		totalSalesByCurrency: ClientReportByCurrency[]
		count: number
	}
	returning: DashboardSummaryBlock
	clientPayment: DashboardSummaryBlock
}

export declare interface StatisticsDashboardSummaryResponse extends GlobalResponse {
	data: StatisticsDashboardSummaryData
}
