import { PaginationRequest, RequestOtherFields } from '@common'
import { SupplierPaymentChangeMethod, SupplierPaymentMethod, SupplierPaymentOptional, SupplierPaymentRequired } from './fields.interfaces'

export declare interface SupplierPaymentFindManyRequest
	extends Pick<SupplierPaymentOptional, 'staffId' | 'supplierId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface SupplierPaymentFindOneRequest extends Pick<SupplierPaymentOptional, 'id'> {}

export declare interface SupplierPaymentGetManyRequest extends SupplierPaymentOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface SupplierPaymentGetOneRequest extends SupplierPaymentOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface SupplierPaymentCreateOneRequest extends Pick<SupplierPaymentRequired, 'supplierId'>, Pick<SupplierPaymentOptional, 'description' | 'staffId'> {
	paymentMethods: SupplierPaymentMethod[]
	changeMethods?: SupplierPaymentChangeMethod[]
}

export declare interface SupplierPaymentUpdateOneRequest extends Pick<SupplierPaymentOptional, 'supplierId' | 'description' | 'deletedAt'> {
	paymentMethods?: SupplierPaymentMethod[]
	changeMethods?: SupplierPaymentChangeMethod[]
}

export declare interface SupplierPaymentDeleteOneRequest extends Pick<SupplierPaymentOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
