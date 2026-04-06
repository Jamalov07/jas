import { GlobalResponse, PaginationResponse } from '@common'
import { StaffPaymentRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface StaffPaymentMethodData {
	type: string
	currencyId: string
	amount: Decimal
}

export declare interface StaffPaymentCalcByCurrency {
	currencyId: string
	total: Decimal
}

export declare interface StaffPaymentFindManyData extends PaginationResponse<StaffPaymentFindOneData> {
	calcByCurrency: StaffPaymentCalcByCurrency[]
}

export declare interface StaffPaymentFindOneData extends Pick<StaffPaymentRequired, 'id'> {
	description?: string | null
	paymentMethods?: StaffPaymentMethodData[]
}

export declare interface StaffPaymentFindManyResponse extends GlobalResponse {
	data: StaffPaymentFindManyData
}

export declare interface StaffPaymentFindOneResponse extends GlobalResponse {
	data: StaffPaymentFindOneData
}

export declare interface StaffPaymentCreateOneResponse extends GlobalResponse {
	data: StaffPaymentFindOneData
}

export declare interface StaffPaymentModifyResponse extends GlobalResponse {
	data: null
}
