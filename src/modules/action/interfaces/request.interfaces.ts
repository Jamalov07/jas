import { PaginationRequest, RequestOtherFields } from '../../../common'
import { ActionOptional, ActionRequired } from './fields.interfaces'

export declare interface ActionFindManyRequest extends Pick<ActionOptional, 'name' | 'url' | 'method' | 'description' | 'permissionId'>, PaginationRequest {}

export declare interface ActionFindOneRequest extends Pick<ActionRequired, 'id'> {}

export declare interface ActionGetManyRequest extends ActionOptional, PaginationRequest, Pick<RequestOtherFields, 'ids'> {}

export declare interface ActionGetOneRequest extends ActionOptional {}

export declare interface ActionUpdateOneRequest extends Pick<ActionOptional, 'description' | 'permissionId'> {}
