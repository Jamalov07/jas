import { PaginationRequest, RequestOtherFields } from '@common'
import { StaffPaymentMethod, StaffPaymentOptional, StaffPaymentRequired } from './fields.interfaces'

export declare interface StaffPaymentFindManyRequest
	extends Pick<StaffPaymentOptional, 'staffId' | 'employeeId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'startDate' | 'endDate'> {}

export declare interface StaffPaymentFindOneRequest extends Pick<StaffPaymentOptional, 'id'> {}

export declare interface StaffPaymentGetManyRequest extends StaffPaymentOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface StaffPaymentGetOneRequest extends StaffPaymentOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface StaffPaymentCreateOneRequest extends Pick<StaffPaymentRequired, 'employeeId' | 'description'>, Pick<StaffPaymentOptional, 'staffId'> {
	paymentMethods: StaffPaymentMethod[]
}

export declare interface StaffPaymentUpdateOneRequest extends Pick<StaffPaymentOptional, 'employeeId' | 'description' | 'deletedAt'> {
	paymentMethods?: StaffPaymentMethod[]
}

export declare interface StaffPaymentDeleteOneRequest extends Pick<StaffPaymentOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
