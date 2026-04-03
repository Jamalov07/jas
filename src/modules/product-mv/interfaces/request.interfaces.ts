import { PaginationRequest, RequestOtherFields } from '@common'
import { ProductMVOptional, ProductMVRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ProductMVFindManyRequest
	extends Pick<ProductMVOptional, 'type' | 'arrivalId' | 'productId' | 'returningId' | 'sellingId' | 'staffId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'startDate' | 'endDate'> {}

export declare interface ProductMVFindOneRequest extends Pick<ProductMVRequired, 'id'> {}

export declare interface ProductMVGetManyRequest extends ProductMVOptional, PaginationRequest, Pick<RequestOtherFields, 'ids'> {}

export declare interface ProductMVGetOneRequest extends ProductMVOptional {}

export declare interface SellingProductMVCreateOneRequest {
	count: number
	price: Decimal
	currencyId: string
	productId: string
	sellingId: string
	staffId?: string
}

export declare interface ArrivalProductMVCreateOneRequest {
	count: number
	cost: Decimal
	costCurrencyId: string
	price: Decimal
	priceCurrencyId: string
	arrivalId: string
	productId: string
	staffId?: string
}

export declare interface ReturningProductMVCreateOneRequest {
	count: number
	price: Decimal
	currencyId: string
	productId: string
	returningId: string
	staffId?: string
}

export declare interface SellingProductMVUpdateOneRequest {
	count?: number
	price?: Decimal
	currencyId?: string
	productId?: string
	sellingId?: string
	send?: boolean
}

export declare interface ArrivalProductMVUpdateOneRequest {
	count?: number
	cost?: Decimal
	costCurrencyId?: string
	price?: Decimal
	priceCurrencyId?: string
	arrivalId?: string
	productId?: string
}

export declare interface ReturningProductMVUpdateOneRequest {
	count?: number
	price?: Decimal
	currencyId?: string
	productId?: string
	returningId?: string
}

export declare interface ProductMVDeleteOneRequest extends Pick<ProductMVOptional, 'id'> {
	send?: boolean
}
