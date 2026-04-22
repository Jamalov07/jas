import { GlobalResponse, PaginationResponse } from '@common'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'

export declare interface SellingProductMVPriceData {
	id?: string
	type: PriceTypeEnum
	price: Decimal
	discount: Decimal
	totalPrice: Decimal
	currencyId: string
	currency?: { symbol: string; id: string }
}

export declare interface SellingProductMVFindOneData {
	id: string
	count: number
	createdAt: Date
	prices?: SellingProductMVPriceData[]
	product?: any
	staff?: any
	selling?: any
}

export declare interface SellingProductMVFindManyData extends PaginationResponse<SellingProductMVFindOneData> {}

export declare interface SellingProductMVFindManyResponse extends GlobalResponse {
	data: SellingProductMVFindManyData
}

export declare interface SellingProductMVFindOneResponse extends GlobalResponse {
	data: SellingProductMVFindOneData
}

export declare interface SellingProductMVModifyResponse extends GlobalResponse {
	data: null
}
