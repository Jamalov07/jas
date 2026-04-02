import { PaginationRequest, RequestOtherFields } from '@common'
import { ClientOptional, ClientRequired } from './fields.interfaces'

export declare interface ClientFindManyRequest
	extends Pick<ClientOptional, 'fullname' | 'phone'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'debtType' | 'debtValue' | 'startDate' | 'endDate'> {}

export declare interface ClientFindOneRequest extends Pick<ClientOptional, 'id'> {
	deedStartDate?: Date
	deedEndDate?: Date
}

export declare interface ClientGetManyRequest extends ClientOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ClientGetOneRequest extends ClientOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ClientCreateOneRequest extends Pick<ClientRequired, 'fullname' | 'phone'> {}

export declare interface ClientUpdateOneRequest extends Pick<ClientOptional, 'fullname' | 'phone' | 'deletedAt' | 'balance'> {}

export declare interface ClientDeleteOneRequest extends Pick<ClientOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
