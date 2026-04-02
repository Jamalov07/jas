import { PaginationRequest, RequestOtherFields } from '@common'
import { ProductPriceOptional, ProductPriceRequired } from './fields.interfaces'

export declare interface ProductPriceFindManyRequest extends Pick<ProductPriceOptional, 'productId' | 'currencyId' | 'type'>, PaginationRequest {}

export declare interface ProductPriceFindOneRequest extends Pick<ProductPriceRequired, 'id'> {}

export declare interface ProductPriceGetManyRequest extends ProductPriceOptional, PaginationRequest, Pick<RequestOtherFields, 'ids'> {}

export declare interface ProductPriceGetOneRequest extends ProductPriceOptional {}

export declare interface ProductPriceCreateOneRequest extends Pick<ProductPriceRequired, 'type' | 'price' | 'totalPrice' | 'productId' | 'currencyId' | 'exchangeRate'> {}

export declare interface ProductPriceUpdateOneRequest extends Pick<ProductPriceOptional, 'type' | 'price' | 'totalPrice' | 'currencyId' | 'exchangeRate'> {}

export declare interface ProductPriceDeleteOneRequest extends Pick<ProductPriceOptional, 'id'> {}
