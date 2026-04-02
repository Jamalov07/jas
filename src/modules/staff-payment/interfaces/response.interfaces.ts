import { GlobalResponse, PaginationResponse } from '@common'
import { StaffPaymentRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface StaffPaymentCalc {
	sum: Decimal
}

export declare interface StaffPaymentFindManyData extends PaginationResponse<StaffPaymentFindOneData> {
	calc: StaffPaymentCalc
}

export declare interface StaffPaymentFindOneData extends Pick<StaffPaymentRequired, 'id' | 'sum' | 'createdAt'> {}

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
