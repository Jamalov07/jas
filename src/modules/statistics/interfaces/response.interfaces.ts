import { GlobalResponse, PaginationResponse } from '@common'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface StatsCurrencyEntry {
	currencyId: string
	symbol: string
	total: Decimal
}

export declare interface StatsPeriodEntry {
	date: string
	sums: StatsCurrencyEntry[]
}

export declare interface StatisticsGetSellingPeriodStatsResponse extends GlobalResponse {
	data: StatsPeriodEntry[]
}

export declare interface StatisticsGetSellingTotalStatsResponse extends GlobalResponse {
	data: {
		daily: StatsPeriodEntry[]
		weekly: StatsPeriodEntry[]
		monthly: StatsPeriodEntry[]
		yearly: StatsPeriodEntry[]
	}
}

export declare interface StatisticsGetAllProductMVResponse extends GlobalResponse {
	data: any
}

export declare interface ClientReportByCurrency {
	currencyId: string
	amount: Decimal
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
