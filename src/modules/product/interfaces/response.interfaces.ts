import { GlobalResponse, PaginationResponse } from '@common'
import { ProductOptional, ProductRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'
import { CurrencyFindOneData } from '../../currency'

export declare interface ProductPriceData {
	id: string
	type: PriceTypeEnum
	price: Decimal
	totalPrice: Decimal
	currency?: CurrencyFindOneData
	exchangeRate: Decimal
}

export declare interface ProductFindManyData extends PaginationResponse<ProductFindOneData> {}

export declare interface ProductFindOneData extends Pick<ProductRequired, 'id' | 'name' | 'createdAt'>, Pick<ProductOptional, 'count' | 'minAmount' | 'description'> {
	prices?: Record<PriceTypeEnum, ProductPriceData>
	lastSellingDate?: Date
	lastSellingCount?: number
	lastSellingPrice?: Decimal
}

export declare interface ProductFindManyResponse extends GlobalResponse {
	data: ProductFindManyData
}

export declare interface ProductFindOneResponse extends GlobalResponse {
	data: ProductFindOneData
}

export declare interface ProductModifyResponse extends GlobalResponse {
	data: null
}
