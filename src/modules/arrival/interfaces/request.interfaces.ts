import { PaginationRequest, RequestOtherFields } from '@common'
import { ArrivalOptional, ArrivalRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum } from '@prisma/client'

export declare interface ArrivalPaymentMethod {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ArrivalPayment {
	paymentMethods?: ArrivalPaymentMethod[]
	description?: string
}

export declare interface ArrivalProduct {
	productId: string
	count: number
	cost: Decimal
	costCurrencyId: string
	price: Decimal
	priceCurrencyId: string
}

export declare interface ArrivalFindManyRequest
	extends Pick<ArrivalOptional, 'supplierId' | 'staffId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface ArrivalFindOneRequest extends Pick<ArrivalOptional, 'id'> {}

export declare interface ArrivalGetManyRequest extends ArrivalOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ArrivalGetOneRequest extends ArrivalOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ArrivalCreateOneRequest extends Pick<ArrivalRequired, 'supplierId' | 'date'>, Pick<ArrivalOptional, 'staffId'> {
	payment?: ArrivalPayment
	products?: ArrivalProduct[]
}

export declare interface ArrivalUpdateOneRequest extends Pick<ArrivalOptional, 'deletedAt' | 'supplierId' | 'date' | 'staffId'> {
	payment?: ArrivalPayment
	products?: ArrivalProduct[]
	productIdsToRemove?: string[]
}

export declare interface ArrivalDeleteOneRequest extends Pick<ArrivalOptional, 'id'>, Pick<RequestOtherFields, 'method'> {}
