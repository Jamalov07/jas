import { PaginationRequest, RequestOtherFields } from '@common'
import { ClientPaymentMethod, ClientPaymentOptional, ClientPaymentRequired } from './fields.interfaces'

export declare interface ClientPaymentFindManyRequest
	extends Pick<ClientPaymentOptional, 'staffId' | 'clientId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface ClientPaymentFindOneRequest extends Pick<ClientPaymentOptional, 'id'> {}

export declare interface ClientPaymentGetManyRequest extends ClientPaymentOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ClientPaymentGetOneRequest extends ClientPaymentOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ClientPaymentCreateOneRequest extends Pick<ClientPaymentRequired, 'clientId'>, Pick<ClientPaymentOptional, 'description' | 'staffId'> {
	paymentMethods: ClientPaymentMethod[]
}

export declare interface ClientPaymentUpdateOneRequest extends Pick<ClientPaymentOptional, 'clientId' | 'description' | 'deletedAt'> {
	paymentMethods?: ClientPaymentMethod[]
}

export declare interface ClientPaymentDeleteOneRequest extends Pick<ClientPaymentOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
