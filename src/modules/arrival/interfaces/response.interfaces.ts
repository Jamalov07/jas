import { GlobalResponse, PaginationResponse } from '@common'
import { ArrivalRequired } from './fields.interfaces'

export declare interface ArrivalFindManyData extends PaginationResponse<ArrivalFindOneData> {}

export declare interface ArrivalFindOneData extends Pick<ArrivalRequired, 'id' | 'date' | 'createdAt'> {}

export declare interface ArrivalFindManyResponse extends GlobalResponse {
	data: ArrivalFindManyData
}

export declare interface ArrivalFindOneResponse extends GlobalResponse {
	data: ArrivalFindOneData
}

export declare interface ArrivalCreateOneResponse extends GlobalResponse {
	data: ArrivalFindOneData
}

export declare interface ArrivalModifyResponse extends GlobalResponse {
	data: null
}
