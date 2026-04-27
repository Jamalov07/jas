import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import { SupplierRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface SupplierDebtByCurrency {
	currencyId: string
	amount: Decimal
	currency: CurrencyBrief
}

export declare interface SupplierDeedValue {
	amount: Decimal
	currencyId: string
	currency: CurrencyBrief
}

export declare interface SupplierDeed {
	type: 'debit' | 'credit'
	action: 'payment' | 'arrival' | 'change'
	date: Date
	description: string
	values: SupplierDeedValue[]
}

export declare interface SupplierDeedInfo {
	deeds: SupplierDeed[]
	totalCreditByCurrency: SupplierDebtByCurrency[]
	totalDebitByCurrency: SupplierDebtByCurrency[]
	debtByCurrency: SupplierDebtByCurrency[]
}

export declare interface SupplierFindManyData extends PaginationResponse<SupplierFindOneData> {}

export declare interface SupplierFindOneData extends Pick<SupplierRequired, 'id' | 'fullname' | 'createdAt' | 'phone'> {
	lastArrivalDate?: Date
	debtByCurrency?: SupplierDebtByCurrency[]
	deedInfo?: SupplierDeedInfo
}

export declare interface SupplierFindManyResponse extends GlobalResponse {
	data: SupplierFindManyData
}

export declare interface SupplierFindOneResponse extends GlobalResponse {
	data: SupplierFindOneData
}

export declare interface SupplierCreateOneResponse extends GlobalResponse {
	data: SupplierFindOneData
}

export declare interface SupplierModifyResponse extends GlobalResponse {
	data: null
}
