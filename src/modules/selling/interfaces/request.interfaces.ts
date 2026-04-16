import { PaginationRequest, RequestOtherFields } from '@common'
import { SellingOptional, SellingRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export declare interface SellingPaymentMethod {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface SellingChangeMethod {
	type: ChangeMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface SellingPayment {
	paymentMethods?: SellingPaymentMethod[]
	changeMethods?: SellingChangeMethod[]
	description?: string
}

export declare interface SellingProduct {
	productId: string
	count: number
	price: Decimal
	currencyId: string
}

export declare interface SellingFindManyRequest
	extends Pick<SellingOptional, 'clientId' | 'staffId' | 'status'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface SellingFindOneRequest extends Pick<SellingOptional, 'id'> {}

export declare interface SellingGetManyRequest extends SellingOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted' | 'startDate' | 'endDate'> {}

export declare interface SellingGetOneRequest extends SellingOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface SellingCreateOneRequest extends Pick<SellingRequired, 'clientId' | 'date'>, Pick<SellingOptional, 'staffId' | 'status'> {
	payment?: SellingPayment
	products?: SellingProduct[]
	send?: boolean
}

export declare interface SellingUpdateOneRequest extends Pick<SellingOptional, 'deletedAt' | 'clientId' | 'date' | 'status' | 'staffId'> {
	payment?: SellingPayment
	send?: boolean
}

export declare interface SellingDeleteOneRequest extends Pick<SellingOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
