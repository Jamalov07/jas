import { GlobalResponse, PaginationResponse } from '@common'
import { ArrivalRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum } from '@prisma/client'

export declare interface ArrivalPaymentMethodData {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ArrivalPaymentData {
	id: string
	description?: string
	paymentMethods: ArrivalPaymentMethodData[]
	createdAt: Date
}

export declare interface ArrivalCalcEntry {
	type: PaymentMethodEnum
	currencyId: string
	total: Decimal
}

export declare interface ArrivalFindManyData extends PaginationResponse<ArrivalFindOneData> {
	calc?: ArrivalCalcEntry[]
}

export declare interface ArrivalFindOneData extends Pick<ArrivalRequired, 'id' | 'date' | 'createdAt'> {
	totalPayment?: Decimal
	payment?: ArrivalPaymentData
	products?: any[]
	supplier?: any
	staff?: any
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
