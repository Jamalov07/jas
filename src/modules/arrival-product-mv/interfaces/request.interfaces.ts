import { PaginationRequest, RequestOtherFields } from '@common'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ArrivalProductMVFindManyRequest extends PaginationRequest, Pick<RequestOtherFields, 'startDate' | 'endDate'> {
	arrivalId?: string
	productId?: string
	staffId?: string
}

export declare interface ArrivalProductMVFindOneRequest {
	id: string
}

export declare interface ArrivalProductMVCreateOneRequest {
	arrivalId: string
	productId: string
	count: number
	cost: Decimal
	costCurrencyId: string
	price: Decimal
	priceCurrencyId: string
	staffId?: string
}

export declare interface ArrivalProductMVUpdateOneRequest {
	count?: number
	cost?: Decimal
	costCurrencyId?: string
	price?: Decimal
	priceCurrencyId?: string
	productId?: string
	arrivalId?: string
}

export declare interface ArrivalProductMVDeleteOneRequest {
	id: string
}
