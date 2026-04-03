import { GlobalResponse, PaginationResponse } from '@common'
import { ArrivalRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ArrivalTotalData {
	id: string
	currencyId: string
	currency: { id: string; symbol: string; name: string }
	totalCost: Decimal
	totalPrice: Decimal
}

export declare interface ArrivalFindManyData extends PaginationResponse<ArrivalFindOneData> {
	calc?: {
		totalPayment: Decimal
		totalCardPayment: Decimal
		totalCashPayment: Decimal
		totalOtherPayment: Decimal
		totalTransferPayment: Decimal
	}
}

export declare interface ArrivalFindOneData extends Pick<ArrivalRequired, 'id' | 'date' | 'createdAt'> {
	totals?: ArrivalTotalData[]
	totalPayment?: Decimal
}

export declare interface ArrivalFindManyResponse extends GlobalResponse {
	data: ArrivalFindManyData
}

export declare interface ArrivalFindOneResponse extends GlobalResponse {
	data: ArrivalFindOneData
}

export declare interface ArrivalCreateOneResponse extends GlobalResponse {
	data: ArrivalFindOneData
}

export declare interface ArrivalModifyResponse extends GlobalResponse {
	data: null
}
