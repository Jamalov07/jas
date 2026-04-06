import { PaginationRequest, RequestOtherFields } from '@common'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface SellingProductMVFindManyRequest extends PaginationRequest, Pick<RequestOtherFields, 'startDate' | 'endDate'> {
	sellingId?: string
	productId?: string
	staffId?: string
}

export declare interface SellingProductMVFindOneRequest {
	id: string
}

export declare interface SellingProductMVCreateOneRequest {
	sellingId: string
	productId: string
	count: number
	price: Decimal
	currencyId: string
	staffId?: string
}

export declare interface SellingProductMVUpdateOneRequest {
	count?: number
	price?: Decimal
	currencyId?: string
	productId?: string
	sellingId?: string
}

export declare interface SellingProductMVDeleteOneRequest {
	id: string
}
