import { GlobalResponse, PaginationResponse } from '@common'
import { ClientDebtByCurrency } from '../../client/interfaces'
import { ReturningRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export declare interface ReturningCalcEntry {
	type: PaymentMethodEnum
	currencyId: string
	total: Decimal
}

export declare interface ReturningChangeCalcEntry {
	type: ChangeMethodEnum
	currencyId: string
	total: Decimal
}

export declare interface ReturningFindManyData extends PaginationResponse<ReturningFindOneData> {
	calc: ReturningCalcEntry[]
	changeCalc: ReturningChangeCalcEntry[]
}

export declare interface ReturningFindOneData extends Pick<ReturningRequired, 'id' | 'status' | 'date' | 'createdAt'> {
	payment?: any
	products?: any[]
	totalPrices?: { currencyId: string; total: Decimal; currency?: { symbol: string } }[]
	totalPayments?: Array<{ currencyId: string; total: Decimal; currency: { id: string; name: string; symbol: string } }>
	totalChanges?: Array<{ currencyId: string; total: Decimal; currency: { id: string; name: string; symbol: string } }>
	debtByCurrency?: { currencyId: string; amount: Decimal; currency?: { id: string; name: string; symbol: string } }[]
	/** `findMany` / `findOne` da client `findMany` bilan bir xil joriy qarz */
	client?: { id: string; fullname: string; phone: string; debtByCurrency: ClientDebtByCurrency[] }
	staff?: any
}

export declare interface ReturningPaymentMethodData {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ReturningChangeMethodData {
	type: ChangeMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ReturningPaymentData {
	id: string
	description?: string
	paymentMethods: ReturningPaymentMethodData[]
	changeMethods: ReturningChangeMethodData[]
	createdAt: Date
}

export declare interface ReturningFindManyResponse extends GlobalResponse {
	data: ReturningFindManyData
}

export declare interface ReturningFindOneResponse extends GlobalResponse {
	data: ReturningFindOneData
}

export declare interface ReturningCreateOneResponse extends GlobalResponse {
	data: ReturningFindOneData
}

export declare interface ReturningModifyResponse extends GlobalResponse {
	data: null
}
