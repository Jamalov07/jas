import { PaginationRequest, RequestOtherFields } from '@common'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ReturningProductMVFindManyRequest extends PaginationRequest, Pick<RequestOtherFields, 'startDate' | 'endDate'> {
	returningId?: string
	productId?: string
	staffId?: string
}

export declare interface ReturningProductMVFindOneRequest {
	id: string
}

export declare interface ReturningProductMVCreateOneRequest {
	returningId: string
	productId: string
	count: number
	price: Decimal
	currencyId: string
	staffId?: string
}

export declare interface ReturningProductMVUpdateOneRequest {
	count?: number
	price?: Decimal
	currencyId?: string
	productId?: string
	returningId?: string
}

export declare interface ReturningProductMVDeleteOneRequest {
	id: string
}
