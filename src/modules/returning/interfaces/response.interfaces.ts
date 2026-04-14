import { GlobalResponse, PaginationResponse } from '@common'
import { ReturningRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum } from '@prisma/client'

export declare interface ReturningCalcEntry {
	type: PaymentMethodEnum
	currencyId: string
	total: Decimal
}

export declare interface ReturningFindManyData extends PaginationResponse<ReturningFindOneData> {
	calc: ReturningCalcEntry[]
}

export declare interface ReturningFindOneData extends Pick<ReturningRequired, 'id' | 'status' | 'date' | 'createdAt'> {
	payment?: any
	products?: any[]
	client?: any
	staff?: any
}

export declare interface ReturningPaymentMethodData {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ReturningPaymentData {
	id: string
	description?: string
	paymentMethods: ReturningPaymentMethodData[]
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
