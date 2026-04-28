import { PaginationRequest, RequestOtherFields } from '@common'
import { ReturningOptional, ReturningRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export declare interface ReturningPaymentMethod {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ReturningChangeMethod {
	type: ChangeMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ReturningPayment {
	paymentMethods?: ReturningPaymentMethod[]
	changeMethods?: ReturningChangeMethod[]
	description?: string
}

export declare interface ReturningProduct {
	productId: string
	count: number
	price: Decimal
	currencyId: string
}

export declare interface ReturningFindManyRequest
	extends Pick<ReturningOptional, 'clientId' | 'staffId' | 'status'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface ReturningFindOneRequest extends Pick<ReturningOptional, 'id'> {}

export declare interface ReturningGetManyRequest extends ReturningOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ReturningGetOneRequest extends ReturningOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ReturningCreateOneRequest extends Pick<ReturningRequired, 'clientId' | 'date'>, Pick<ReturningOptional, 'staffId' | 'status' | 'description'> {
	payment?: ReturningPayment
	products?: ReturningProduct[]
}

export declare interface ReturningUpdateOneRequest extends Pick<ReturningOptional, 'deletedAt' | 'clientId' | 'date' | 'staffId' | 'status' | 'description'> {
	payment?: ReturningPayment
	products?: ReturningProduct[]
	productIdsToRemove?: string[]
}

export declare interface ReturningDeleteOneRequest extends Pick<ReturningOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
