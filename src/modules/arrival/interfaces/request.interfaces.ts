import { PaginationRequest, RequestOtherFields } from '@common'
import { ArrivalOptional, ArrivalRequired } from './fields.interfaces'
import { SupplierPaymentOptional, SupplierPaymentRequired } from '../../supplier-payment'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ArrivalFindManyRequest
	extends Pick<ArrivalOptional, 'supplierId' | 'staffId'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'isDeleted' | 'search' | 'startDate' | 'endDate'> {}

export declare interface ArrivalFindOneRequest extends Pick<ArrivalOptional, 'id'> {}

export declare interface ArrivalGetManyRequest extends ArrivalOptional, PaginationRequest, Pick<RequestOtherFields, 'ids' | 'isDeleted'> {}

export declare interface ArrivalGetOneRequest extends ArrivalOptional, Pick<RequestOtherFields, 'isDeleted'> {}

export declare interface ArrivalPayment extends Pick<SupplierPaymentRequired, 'card' | 'cash' | 'other' | 'transfer'>, Pick<SupplierPaymentOptional, 'total' | 'description'> {}

export declare interface ArrivalProduct {
	productId: string
	count: number
	cost: Decimal
	costCurrencyId: string
	price: Decimal
	priceCurrencyId: string
	totalCost?: Decimal
	totalPrice?: Decimal
}

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
