import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import { ClientPaymentRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ClientPaymentMethodData {
	type: string
	currencyId: string
	amount: Decimal
}

export declare interface ClientPaymentChangeMethodData {
	type: string
	currencyId: string
	amount: Decimal
}

export declare interface ClientPaymentCalcByCurrency {
	currencyId: string
	total: Decimal
	currency: CurrencyBrief
}

export declare interface ClientPaymentFindManyData extends PaginationResponse<ClientPaymentFindOneData> {
	calcByCurrency: ClientPaymentCalcByCurrency[]
}

export declare interface ClientPaymentFindOneData extends Pick<ClientPaymentRequired, 'id'> {
	description?: string | null
	paymentMethods?: ClientPaymentMethodData[]
	changeMethods?: ClientPaymentChangeMethodData[]
}

export declare interface ClientPaymentFindManyResponse extends GlobalResponse {
	data: ClientPaymentFindManyData
}

export declare interface ClientPaymentFindOneResponse extends GlobalResponse {
	data: ClientPaymentFindOneData
}

export declare interface ClientPaymentCreateOneResponse extends GlobalResponse {
	data: ClientPaymentFindOneData
}

export declare interface ClientPaymentModifyResponse extends GlobalResponse {
	data: null
}
