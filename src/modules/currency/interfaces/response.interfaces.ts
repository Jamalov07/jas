import { GlobalResponse, PaginationResponse } from '@common'
import { CurrencyRequired } from './fields.interfaces'

export declare interface CurrencyFindManyData extends PaginationResponse<CurrencyFindOneData> {}

export declare interface CurrencyFindOneData extends Pick<CurrencyRequired, 'id' | 'name' | 'symbol' | 'isActive' | 'exchangeRate' | 'createdAt'> {}

export declare interface CurrencyFindManyResponse extends GlobalResponse {
	data: CurrencyFindManyData
}

export declare interface CurrencyFindOneResponse extends GlobalResponse {
	data: CurrencyFindOneData
}

export declare interface CurrencyModifyResponse extends GlobalResponse {
	data: null
}
