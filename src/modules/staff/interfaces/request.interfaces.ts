import { PaginationRequest, RequestOtherFields } from '@common'
import { StaffOptional, StaffRequired } from './fields.interfaces'

export declare interface StaffFindManyRequest extends Pick<StaffOptional, 'fullname' | 'phone'>, PaginationRequest, Pick<RequestOtherFields, 'isDeleted' | 'search'> {}

export declare interface StaffFindOneRequest extends Pick<StaffOptional, 'id'> {}

export declare interface StaffGetManyRequest extends StaffOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface StaffGetOneRequest extends StaffOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface StaffCreateOneRequest extends Pick<StaffRequired, 'fullname' | 'phone' | 'password'>, Pick<RequestOtherFields, 'actionsToConnect' | 'pagesToConnect'> {}

export declare interface StaffUpdateOneRequest
	extends Pick<StaffOptional, 'fullname' | 'password' | 'phone' | 'token' | 'deletedAt' | 'balance'>,
		Pick<RequestOtherFields, 'actionsToConnect' | 'actionsToDisconnect' | 'pagesToConnect' | 'pagesToDisconnect'> {}

export declare interface StaffDeleteOneRequest extends Pick<StaffOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
