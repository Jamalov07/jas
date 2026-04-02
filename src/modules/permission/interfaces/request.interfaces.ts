import { PaginationRequest, RequestOtherFields } from '@common'
import { PermissionOptional, PermissionRequired } from './fields.interfaces'

export declare interface PermissionFindManyRequest extends Pick<PermissionOptional, 'name'>, PaginationRequest {}

export declare interface PermissionFindOneRequest extends Pick<PermissionRequired, 'id'> {}

export declare interface PermissionGetManyRequest extends PermissionOptional, PaginationRequest, Pick<RequestOtherFields, 'ids'> {}

export declare interface PermissionGetOneRequest extends PermissionOptional {}

export declare interface PermissionCreateOneRequest extends Pick<PermissionRequired, 'name'>, Pick<RequestOtherFields, 'actionsToConnect'> {}

export declare interface PermissionUpdateOneRequest extends Pick<PermissionOptional, 'name' | 'deletedAt'>, Pick<RequestOtherFields, 'actionsToConnect' | 'actionsToDisconnect'> {}

export declare interface PermissionDeleteOneRequest extends Pick<PermissionOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
