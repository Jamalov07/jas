import { PaginationRequest, RequestOtherFields } from '@common'
import { ReturningOptional, ReturningRequired } from './fields.interfaces'
import { ProductMVRequired } from '../../product-mv'
import { PaymentModel } from '@prisma/client'

export declare interface ReturningFindManyRequest
	extends Pick<ReturningOptional, 'clientId' | 'staffId' | 'status'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface ReturningFindOneRequest extends Pick<ReturningOptional, 'id'> {}

export declare interface ReturningGetManyRequest extends ReturningOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ReturningGetOneRequest extends ReturningOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ReturningPayment extends Pick<PaymentModel, 'fromBalance' | 'cash' | 'total'> {}

export declare interface ReturningProduct extends Pick<ProductMVRequired, 'price' | 'count' | 'totalPrice' | 'productId'> {}

export declare interface ReturningCreateOneRequest extends Pick<ReturningRequired, 'clientId' | 'date'>, Pick<ReturningOptional, 'staffId' | 'status' | 'totalPrice'> {
	payment?: ReturningPayment
	products?: ReturningProduct[]
}

export declare interface ReturningUpdateOneRequest extends Pick<ReturningOptional, 'deletedAt' | 'clientId' | 'date' | 'staffId' | 'status' | 'totalPrice'> {
	payment?: ReturningPayment
	products?: ReturningProduct[]
	productIdsToRemove?: string[]
}

export declare interface ReturningDeleteOneRequest extends Pick<ReturningOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
