import { GlobalResponse, PaginationResponse } from '@common'
import { PermissionRequired } from './fields.interfaces'
import { ActionFindOneData } from '../../action/interfaces'

export declare interface PermissionFindManyData extends PaginationResponse<PermissionFindOneData> {}

export declare interface PermissionFindOneData extends Pick<PermissionRequired, 'id' | 'name' | 'createdAt'> {
	actions?: ActionFindOneData[]
}

export declare interface PermissionFindManyResponse extends GlobalResponse {
	data: PermissionFindManyData
}

export declare interface PermissionFindOneResponse extends GlobalResponse {
	data: PermissionFindOneData
}

export declare interface PermissionModifyResponse extends GlobalResponse {
	data: null
}
