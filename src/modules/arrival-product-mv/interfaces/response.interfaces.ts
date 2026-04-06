import { GlobalResponse, PaginationResponse } from '@common'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'

export declare interface ArrivalProductMVPriceData {
	id?: string
	type: PriceTypeEnum
	price: Decimal
	totalPrice: Decimal
	currencyId: string
	currency?: { symbol: string; id: string }
}

export declare interface ArrivalProductMVFindOneData {
	id: string
	count: number
	createdAt: Date
	prices?: ArrivalProductMVPriceData[]
	product?: any
	staff?: any
	arrival?: any
}

export declare interface ArrivalProductMVFindManyData extends PaginationResponse<ArrivalProductMVFindOneData> {}

export declare interface ArrivalProductMVFindManyResponse extends GlobalResponse {
	data: ArrivalProductMVFindManyData
}

export declare interface ArrivalProductMVFindOneResponse extends GlobalResponse {
	data: ArrivalProductMVFindOneData
}

export declare interface ArrivalProductMVModifyResponse extends GlobalResponse {
	data: null
}
