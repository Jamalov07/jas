import { PaginationRequest, RequestOtherFields } from '@common'
import { CurrencyOptional, CurrencyRequired } from './fields.interfaces'

export declare interface CurrencyFindManyRequest extends Pick<CurrencyOptional, 'name' | 'symbol' | 'isActive'>, PaginationRequest, Pick<RequestOtherFields, 'search'> {}

export declare interface CurrencyFindOneRequest extends Pick<CurrencyRequired, 'id'> {}

export declare interface CurrencyGetManyRequest extends CurrencyOptional, PaginationRequest, Pick<RequestOtherFields, 'ids'> {}

export declare interface CurrencyGetOneRequest extends CurrencyOptional {}

export declare interface CurrencyCreateOneRequest extends Pick<CurrencyRequired, 'name' | 'symbol' | 'exchangeRate'>, Pick<CurrencyOptional, 'isActive'> {}

export declare interface CurrencyUpdateOneRequest extends Pick<CurrencyOptional, 'name' | 'symbol' | 'exchangeRate' | 'isActive'> {}

export declare interface CurrencyDeleteOneRequest extends Pick<CurrencyOptional, 'id'> {}
