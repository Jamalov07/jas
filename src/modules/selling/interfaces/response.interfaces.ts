import { GlobalResponse, PaginationResponse } from '@common'
import { SellingOptional, SellingRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum, PriceTypeEnum } from '@prisma/client'

export declare interface SellingPaymentMethodData {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface SellingPaymentData {
	id: string
	description?: string
	paymentMethods: SellingPaymentMethodData[]
	createdAt: Date
}

export declare interface SellingProductPriceData {
	type: PriceTypeEnum
	price: Decimal
	totalPrice: Decimal
	currencyId: string
	currency?: { symbol: string }
}

export declare interface SellingProductData {
	id: string
	count: number
	createdAt: Date
	product: { id: string; name: string; createdAt: Date }
	prices: SellingProductPriceData[]
}

export declare interface SellingTotalByCurrency {
	currencyId: string
	total: Decimal
}

export declare interface SellingCalcEntry {
	type: PaymentMethodEnum
	currencyId: string
	total: Decimal
}

export declare interface SellingFindManyData extends PaginationResponse<SellingFindOneData> {
	calc: SellingCalcEntry[]
}

export declare interface SellingFindOneData extends Pick<SellingRequired, 'id' | 'status' | 'createdAt' | 'date'>, Pick<SellingOptional, 'publicId'> {
	client?: any
	staff?: any
	totalPrices?: SellingTotalByCurrency[]
	payment?: SellingPaymentData
	products?: SellingProductData[]
}

export declare interface SellingFindManyResponse extends GlobalResponse {
	data: SellingFindManyData
}

export declare interface SellingFindOneResponse extends GlobalResponse {
	data: SellingFindOneData
}

export declare interface SellingCreateOneResponse extends GlobalResponse {
	data: SellingFindOneData
}

export declare interface SellingModifyResponse extends GlobalResponse {
	data: null
}
