import { PaginationRequest, RequestOtherFields } from '@common'
import { ClientPaymentOptional, ClientPaymentRequired } from './fields.interfaces'

export declare interface ClientPaymentFindManyRequest
	extends Pick<ClientPaymentOptional, 'staffId' | 'userId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface ClientPaymentFindOneRequest extends Pick<ClientPaymentOptional, 'id'> {}

export declare interface ClientPaymentGetManyRequest extends ClientPaymentOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ClientPaymentGetOneRequest extends ClientPaymentOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ClientPaymentCreateOneRequest
	extends Pick<ClientPaymentRequired, 'userId' | 'card' | 'cash' | 'other' | 'transfer'>,
		Pick<ClientPaymentOptional, 'description' | 'staffId' | 'total'> {}

export declare interface ClientPaymentUpdateOneRequest
	extends Pick<ClientPaymentOptional, 'userId' | 'card' | 'description' | 'deletedAt' | 'cash' | 'other' | 'transfer' | 'total'> {}

export declare interface ClientPaymentDeleteOneRequest extends Pick<ClientPaymentOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
