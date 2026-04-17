import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import { ClientRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ClientDebtByCurrency {
	currencyId: string
	amount: Decimal
	currency: CurrencyBrief
}

export declare interface ClientDeed {
	type: 'debit' | 'credit'
	action: 'selling' | 'payment' | 'returning' | 'change'
	date: Date
	value: Decimal
	description: string
	currencyId?: string
}

export declare interface ClientDeedInfo {
	deeds: ClientDeed[]
	totalCreditByCurrency: ClientDebtByCurrency[]
	totalDebitByCurrency: ClientDebtByCurrency[]
	debtByCurrency: ClientDebtByCurrency[]
}

export declare interface ClientFindManyData extends PaginationResponse<ClientFindOneData> {}

/** Hisobot: to‘lov usuli × valyuta bo‘yicha yig‘ma */
export declare interface ClientReportPaymentRow {
	type: string
	currencyId: string
	amount: Decimal
	currency: CurrencyBrief
}

/** Hisobot: mahsulot qatori yoki boshqa valyuta bo‘yicha summa */
export declare interface ClientReportCurrencyTotal {
	currencyId: string
	amount: Decimal
	currency: CurrencyBrief
}

export declare interface ClientReportPeriod {
	startDate?: Date
	endDate?: Date
}

/** `many/report` — sotuv (shu jumladan alohida client to‘lovlari yig‘indisi) / qaytish */
export declare interface ClientReportSummary {
	period: ClientReportPeriod | null
	selling: {
		documentsCount: number
		productTotalsByCurrency: ClientReportCurrencyTotal[]
		paymentMethods: ClientReportPaymentRow[]
		changeMethods: ClientReportPaymentRow[]
	}
	returning: {
		documentsCount: number
		productTotalsByCurrency: ClientReportCurrencyTotal[]
		paymentMethods: ClientReportPaymentRow[]
		changeMethods: ClientReportPaymentRow[]
	}
}

export declare interface ClientFindOneData extends Pick<ClientRequired, 'id' | 'fullname' | 'createdAt' | 'phone'> {
	debtByCurrency?: ClientDebtByCurrency[]
	lastSellingDate?: Date
	deedInfo?: ClientDeedInfo
	telegram?: { id?: string; isActive?: boolean }
	/** Faqat `findManyForReport` */
	report?: ClientReportSummary
}

export declare interface ClientFindManyResponse extends GlobalResponse {
	data: ClientFindManyData
}

export declare interface ClientFindOneResponse extends GlobalResponse {
	data: ClientFindOneData
}

export declare interface ClientCreateOneResponse extends GlobalResponse {
	data: ClientFindOneData
}

export declare interface ClientModifyResponse extends GlobalResponse {
	data: null
}
