import { PaginationRequest, RequestOtherFields } from '@common'
import { StaffPaymentOptional, StaffPaymentRequired } from './fields.interfaces'

export declare interface StaffPaymentFindManyRequest
	extends Pick<StaffPaymentOptional, 'staffId' | 'userId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'startDate' | 'endDate'> {}

export declare interface StaffPaymentFindOneRequest extends Pick<StaffPaymentOptional, 'id'> {}

export declare interface StaffPaymentGetManyRequest extends StaffPaymentOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface StaffPaymentGetOneRequest extends StaffPaymentOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface StaffPaymentCreateOneRequest extends Pick<StaffPaymentRequired, 'sum' | 'description' | 'userId'>, Pick<StaffPaymentOptional, 'staffId' | 'total'> {}

export declare interface StaffPaymentUpdateOneRequest extends Pick<StaffPaymentOptional, 'userId' | 'sum' | 'description' | 'deletedAt' | 'total'> {}

export declare interface StaffPaymentDeleteOneRequest extends Pick<StaffPaymentOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
