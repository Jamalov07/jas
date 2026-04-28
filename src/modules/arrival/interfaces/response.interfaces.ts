import { GlobalResponse, PaginationResponse } from '@common'
import { ArrivalOptional, ArrivalRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export declare interface ArrivalPaymentMethodData {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ArrivalChangeMethodData {
	type: ChangeMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface ArrivalPaymentData {
	id: string
	description?: string
	paymentMethods: ArrivalPaymentMethodData[]
	changeMethods: ArrivalChangeMethodData[]
	createdAt: Date
}

export declare interface ArrivalCalcEntry {
	type: PaymentMethodEnum
	currencyId: string
	total: Decimal
}

export declare interface ArrivalChangeCalcEntry {
	type: ChangeMethodEnum
	currencyId: string
	total: Decimal
}

export declare interface ArrivalFindManyData extends PaginationResponse<ArrivalFindOneData> {
	calc?: ArrivalCalcEntry[]
	changeCalc?: ArrivalChangeCalcEntry[]
}

export declare interface ArrivalFindOneData extends Pick<ArrivalRequired, 'id' | 'date' | 'createdAt'>, Pick<ArrivalOptional, 'description'> {
	totalPayment?: Decimal
	payment?: ArrivalPaymentData
	products?: any[]
	totalPrices?: Record<string, { currencyId: string; total: Decimal; currency: { symbol: string } }[]>
	totalPayments?: Array<{ currencyId: string; total: Decimal; currency: { id: string; name: string; symbol: string } }>
	totalChanges?: Array<{ currencyId: string; total: Decimal; currency: { id: string; name: string; symbol: string } }>
	debtByCurrency?: { currencyId: string; amount: Decimal; currency: { id: string; name: string; symbol: string } }[]
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
