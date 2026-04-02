import { GlobalResponse, PaginationResponse } from '../../../common'
import { PermissionFindOneData } from '../../permission'
import { ActionRequired } from './fields.interfaces'

export declare interface ActionFindManyData extends PaginationResponse<ActionFindOneData> {}

export declare interface ActionFindOneData extends Pick<ActionRequired, 'id' | 'name' | 'url' | 'method' | 'description'> {
	permission?: PermissionFindOneData
}

export declare interface ActionFindManyResponse extends GlobalResponse {
	data: ActionFindManyData
}

export declare interface ActionFindOneResponse extends GlobalResponse {
	data: ActionFindOneData
}

export declare interface ActionModifyResponse extends GlobalResponse {
	data: null
}
