import { GlobalResponse, PaginationResponse } from '@common'
import { SupplierPaymentRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface SupplierPaymentCalc {
	totalCard: Decimal
	totalCash: Decimal
	totalOther: Decimal
	totalTransfer: Decimal
}

export declare interface SupplierPaymentFindManyData extends PaginationResponse<SupplierPaymentFindOneData> {
	calc: SupplierPaymentCalc
}

export declare interface SupplierPaymentFindOneData extends Pick<SupplierPaymentRequired, 'id' | 'description' | 'createdAt'> {}

export declare interface SupplierPaymentFindManyResponse extends GlobalResponse {
	data: SupplierPaymentFindManyData
}

export declare interface SupplierPaymentFindOneResponse extends GlobalResponse {
	data: SupplierPaymentFindOneData
}

export declare interface SupplierPaymentCreateOneResponse extends GlobalResponse {
	data: SupplierPaymentFindOneData
}

export declare interface SupplierPaymentModifyResponse extends GlobalResponse {
	data: null
}
