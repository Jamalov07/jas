import { GlobalResponse, PaginationResponse } from '@common'
import { ReturningRequired } from './fields.interfaces'

export declare interface ReturningFindManyData extends PaginationResponse<ReturningFindOneData> {}

export declare interface ReturningFindOneData extends Pick<ReturningRequired, 'id' | 'status' | 'date' | 'createdAt'> {}

export declare interface ReturningFindManyResponse extends GlobalResponse {
	data: ReturningFindManyData
}

export declare interface ReturningFindOneResponse extends GlobalResponse {
	data: ReturningFindOneData
}

export declare interface ReturningCreateOneResponse extends GlobalResponse {
	data: ReturningFindOneData
}

export declare interface ReturningModifyResponse extends GlobalResponse {
	data: null
}
