import { PaginationRequest, RequestOtherFields } from '@common'
import { ReturningOptional, ReturningRequired } from './fields.interfaces'
import { PaymentModel } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ReturningFindManyRequest
	extends Pick<ReturningOptional, 'clientId' | 'staffId' | 'status'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface ReturningFindOneRequest extends Pick<ReturningOptional, 'id'> {}

export declare interface ReturningGetManyRequest extends ReturningOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ReturningGetOneRequest extends ReturningOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ReturningPayment extends Pick<PaymentModel, 'fromBalance' | 'cash'> {
	total?: PaymentModel['total']
}

export declare interface ReturningProduct {
	productId: string
	count: number
	price: Decimal
	currencyId: string
	totalPrice?: Decimal
}

export declare interface ReturningCreateOneRequest extends Pick<ReturningRequired, 'clientId' | 'date'>, Pick<ReturningOptional, 'staffId' | 'status'> {
	payment?: ReturningPayment
	products?: ReturningProduct[]
}

export declare interface ReturningUpdateOneRequest extends Pick<ReturningOptional, 'deletedAt' | 'clientId' | 'date' | 'staffId' | 'status'> {
	payment?: ReturningPayment
	products?: ReturningProduct[]
	productIdsToRemove?: string[]
}

export declare interface ReturningDeleteOneRequest extends Pick<ReturningOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
