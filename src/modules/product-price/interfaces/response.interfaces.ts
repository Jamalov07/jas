import { GlobalResponse, PaginationResponse } from '@common'
import { ProductPriceRequired } from './fields.interfaces'

export declare interface ProductPriceFindManyData extends PaginationResponse<ProductPriceFindOneData> {}

export declare interface ProductPriceFindOneData extends Pick<ProductPriceRequired, 'id' | 'type' | 'price' | 'totalPrice' | 'productId' | 'currencyId' | 'exchangeRate'> {}

export declare interface ProductPriceFindManyResponse extends GlobalResponse {
	data: ProductPriceFindManyData
}

export declare interface ProductPriceFindOneResponse extends GlobalResponse {
	data: ProductPriceFindOneData
}

export declare interface ProductPriceModifyResponse extends GlobalResponse {
	data: null
}
