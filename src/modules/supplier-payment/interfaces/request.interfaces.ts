import { PaginationRequest, RequestOtherFields } from '@common'
import { SupplierPaymentOptional, SupplierPaymentRequired } from './fields.interfaces'

export declare interface SupplierPaymentFindManyRequest
	extends Pick<SupplierPaymentOptional, 'staffId' | 'userId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface SupplierPaymentFindOneRequest extends Pick<SupplierPaymentOptional, 'id'> {}

export declare interface SupplierPaymentGetManyRequest extends SupplierPaymentOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface SupplierPaymentGetOneRequest extends SupplierPaymentOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface SupplierPaymentCreateOneRequest
	extends Pick<SupplierPaymentRequired, 'userId' | 'card' | 'cash' | 'other' | 'transfer'>,
		Pick<SupplierPaymentOptional, 'description' | 'staffId' | 'total'> {}

export declare interface SupplierPaymentUpdateOneRequest
	extends Pick<SupplierPaymentOptional, 'userId' | 'card' | 'description' | 'deletedAt' | 'cash' | 'other' | 'transfer' | 'total'> {}

export declare interface SupplierPaymentDeleteOneRequest extends Pick<SupplierPaymentOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
