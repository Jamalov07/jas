import { PaginationRequest, RequestOtherFields } from '@common'
import { ProductOptional, ProductRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ProductPriceInput {
	price: Decimal
	currencyId: string
	exchangeRate: Decimal
}

export declare interface ProductPriceUpdateInput {
	price?: Decimal
}

export declare interface ProductPricesInput {
	cost: ProductPriceInput
	selling: ProductPriceInput
	wholesale: ProductPriceInput
}

export declare interface ProductPricesUpdateInput {
	cost?: ProductPriceUpdateInput
	selling?: ProductPriceUpdateInput
	wholesale?: ProductPriceUpdateInput
}

export declare interface ProductFindManyRequest extends Pick<ProductOptional, 'name'>, PaginationRequest, Pick<RequestOtherFields, 'isDeleted' | 'search'> {}

export declare interface ProductFindOneRequest extends Pick<ProductRequired, 'id'> {}

export declare interface ProductGetManyRequest extends ProductOptional, PaginationRequest, Pick<RequestOtherFields, 'ids'> {}

export declare interface ProductGetOneRequest extends ProductOptional {}

export declare interface ProductCreateOneRequest extends Pick<ProductRequired, 'name' | 'count' | 'minAmount'>, Pick<ProductOptional, 'description'> {
	prices: ProductPricesInput
}

export declare interface ProductUpdateOneRequest extends Pick<ProductOptional, 'name' | 'deletedAt' | 'count' | 'minAmount' | 'description'> {
	prices?: ProductPricesUpdateInput
}

export declare interface ProductDeleteOneRequest extends Pick<ProductOptional, 'id'> {}
