import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import { SupplierPaymentRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface SupplierPaymentMethodData {
	type: string
	currencyId: string
	amount: Decimal
}

export declare interface SupplierPaymentChangeMethodData {
	type: string
	currencyId: string
	amount: Decimal
}

export declare interface SupplierPaymentCalcByCurrency {
	currencyId: string
	total: Decimal
	currency: CurrencyBrief
}

export declare interface SupplierPaymentFindManyData extends PaginationResponse<SupplierPaymentFindOneData> {
	calcByCurrency: SupplierPaymentCalcByCurrency[]
}

export declare interface SupplierPaymentFindOneData extends Pick<SupplierPaymentRequired, 'id'> {
	description?: string | null
	paymentMethods?: SupplierPaymentMethodData[]
	changeMethods?: SupplierPaymentChangeMethodData[]
}

export declare interface SupplierPaymentFindManyResponse extends GlobalResponse {
	data: SupplierPaymentFindManyData
}

export declare interface SupplierPaymentFindOneResponse extends GlobalResponse {
	data: SupplierPaymentFindOneData
}

export declare interface SupplierPaymentCreateOneResponse extends GlobalResponse {
	data: SupplierPaymentFindOneData
}

export declare interface SupplierPaymentModifyResponse extends GlobalResponse {
	data: null
}
