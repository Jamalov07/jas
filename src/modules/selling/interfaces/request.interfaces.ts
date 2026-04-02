import { PaginationRequest, RequestOtherFields } from '@common'
import { SellingOptional, SellingRequired } from './fields.interfaces'
import { ClientPaymentOptional, ClientPaymentRequired } from '../../client-payment'
import { ProductMVOptional, ProductMVRequired } from '../../product-mv'
import { StatsTypeEnum } from '../enums'

export declare interface SellingFindManyRequest
	extends Pick<SellingOptional, 'clientId' | 'staffId' | 'status'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface SellingFindOneRequest extends Pick<SellingOptional, 'id'> {}

export declare interface SellingGetManyRequest extends SellingOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted' | 'startDate' | 'endDate'> {}

export declare interface SellingGetOneRequest extends SellingOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface SellingPayment extends Pick<ClientPaymentRequired, 'card' | 'cash' | 'other' | 'transfer'>, Pick<ClientPaymentOptional, 'description' | 'total'> {}

export declare interface SellingProduct extends Pick<ProductMVRequired, 'price' | 'count' | 'productId'>, Pick<ProductMVOptional, 'totalPrice'> {}

export declare interface SellingCreateOneRequest extends Pick<SellingRequired, 'clientId' | 'date'>, Pick<SellingOptional, 'staffId' | 'status' | 'totalPrice'> {
	payment?: SellingPayment
	products?: SellingProduct[]
	send?: boolean
}

export declare interface SellingUpdateOneRequest extends Pick<SellingOptional, 'deletedAt' | 'clientId' | 'date' | 'status' | 'staffId' | 'totalPrice'> {
	payment?: SellingPayment
	send?: boolean
}

export declare interface SellingDeleteOneRequest extends Pick<SellingOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}

export declare interface SellingGetTotalStatsRequest {}

export declare interface SellingGetPeriodStatsRequest {
	type?: StatsTypeEnum
}
