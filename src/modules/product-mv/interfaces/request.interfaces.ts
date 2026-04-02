import { PaginationRequest, RequestOtherFields } from '@common'
import { ProductMVOptional, ProductMVRequired } from './fields.interfaces'

export declare interface ProductMVFindManyRequest
	extends Pick<ProductMVOptional, 'type' | 'arrivalId' | 'productId' | 'returningId' | 'sellingId' | 'staffId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'startDate' | 'endDate'> {}

export declare interface ProductMVFindOneRequest extends Pick<ProductMVRequired, 'id'> {}

export declare interface ProductMVGetManyRequest extends ProductMVOptional, PaginationRequest, Pick<RequestOtherFields, 'ids'> {}

export declare interface ProductMVGetOneRequest extends ProductMVOptional {}

export declare interface SellingProductMVCreateOneRequest
	extends Pick<ProductMVRequired, 'count' | 'price' | 'productId' | 'sellingId'>,
		Pick<ProductMVOptional, 'staffId' | 'totalPrice'> {}
export declare interface ArrivalProductMVCreateOneRequest
	extends Pick<ProductMVRequired, 'cost' | 'count' | 'price' | 'arrivalId' | 'productId'>,
		Pick<ProductMVOptional, 'staffId' | 'totalCost' | 'totalPrice'> {}

export declare interface ReturningProductMVCreateOneRequest
	extends Pick<ProductMVRequired, 'count' | 'price' | 'productId' | 'returningId'>,
		Pick<ProductMVOptional, 'staffId' | 'totalPrice'> {}

export declare interface SellingProductMVUpdateOneRequest extends Pick<ProductMVOptional, 'count' | 'price' | 'productId' | 'sellingId' | 'totalPrice'> {
	send?: boolean
}
export declare interface ArrivalProductMVUpdateOneRequest extends Pick<ProductMVOptional, 'cost' | 'count' | 'price' | 'arrivalId' | 'productId' | 'totalCost' | 'totalPrice'> {}
export declare interface ReturningProductMVUpdateOneRequest extends Pick<ProductMVOptional, 'count' | 'price' | 'productId' | 'returningId' | 'totalPrice'> {}

export declare interface ProductMVDeleteOneRequest extends Pick<ProductMVOptional, 'id'> {
	send?: boolean
}
