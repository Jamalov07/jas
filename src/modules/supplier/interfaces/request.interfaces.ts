import { PaginationRequest, RequestOtherFields } from '@common'
import { SupplierOptional, SupplierRequired } from './fields.interfaces'

export declare interface SupplierFindManyRequest
	extends Pick<SupplierOptional, 'fullname' | 'phone'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'debtType' | 'debtValue'> {}

export declare interface SupplierFindOneRequest extends Pick<SupplierOptional, 'id'> {
	deedStartDate?: Date
	deedEndDate?: Date
}

export declare interface SupplierGetManyRequest extends SupplierOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface SupplierGetOneRequest extends SupplierOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface SupplierCreateOneRequest extends Pick<SupplierRequired, 'fullname' | 'phone'> {}

export declare interface SupplierUpdateOneRequest extends Pick<SupplierOptional, 'fullname' | 'phone' | 'deletedAt' | 'balance'> {}

export declare interface SupplierDeleteOneRequest extends Pick<SupplierOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
