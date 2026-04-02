import { GlobalResponse, PaginationResponse } from '@common'
import { ClientPaymentOptional, ClientPaymentRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ClientPaymentCalc {
	totalCard: Decimal
	totalCash: Decimal
	totalOther: Decimal
	totalTransfer: Decimal
}

export declare interface ClientPaymentFindManyData extends PaginationResponse<ClientPaymentFindOneData> {
	calc: ClientPaymentCalc
}

export declare interface ClientPaymentFindOneData extends Pick<ClientPaymentRequired, 'id' | 'description'>, Pick<ClientPaymentOptional, 'total'> {}

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
