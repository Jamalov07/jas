import { GlobalResponse, PaginationResponse } from '@common'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'

export declare interface ReturningProductMVPriceData {
	id?: string
	type: PriceTypeEnum
	price: Decimal
	totalPrice: Decimal
	currencyId: string
	currency?: { symbol: string; id: string }
}

export declare interface ReturningProductMVFindOneData {
	id: string
	count: number
	createdAt: Date
	prices?: ReturningProductMVPriceData[]
	product?: any
	staff?: any
	returning?: any
}

export declare interface ReturningProductMVFindManyData extends PaginationResponse<ReturningProductMVFindOneData> {}

export declare interface ReturningProductMVFindManyResponse extends GlobalResponse {
	data: ReturningProductMVFindManyData
}

export declare interface ReturningProductMVFindOneResponse extends GlobalResponse {
	data: ReturningProductMVFindOneData
}

export declare interface ReturningProductMVModifyResponse extends GlobalResponse {
	data: null
}
