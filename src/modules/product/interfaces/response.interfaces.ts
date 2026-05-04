import { GlobalResponse, PaginationResponse } from '@common'
import { ProductOptional, ProductRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'
import { CurrencyFindOneData } from '../../currency'

export declare interface ProductPriceData {
	id: string
	type: PriceTypeEnum
	price: Decimal
	totalPrice: Decimal
	currency?: CurrencyFindOneData
	exchangeRate: Decimal
}

/** Valyuta bo‘yicha yig‘indi (faqat aktiv valyutalar ro‘yxati bo‘yicha) */
export declare interface ProductFindManyMoneyByCurrency {
	currencyId: string
	total: Decimal
	currency: { id: string; name: string; symbol: string }
}

/** Joriy sahifa / filter bo‘yicha ombor: `totalCount` bitta, narxlari valyuta bo‘yicha massiv */
export declare interface ProductFindManyCalc {
	totalCount: number
	totalCosts: ProductFindManyMoneyByCurrency[]
	totalPrices: ProductFindManyMoneyByCurrency[]
	totalWholesales: ProductFindManyMoneyByCurrency[]
}

export declare interface ProductFindManyData extends PaginationResponse<ProductFindOneData> {
	calc: { calcPage: ProductFindManyCalc; calcTotal: ProductFindManyCalc }
}

export declare interface ProductFindOneData extends Pick<ProductRequired, 'id' | 'name' | 'createdAt'>, Pick<ProductOptional, 'count' | 'minAmount' | 'description' | 'image'> {
	prices?: Record<PriceTypeEnum, ProductPriceData>
	lastSelling?: {
		date: Date | null
		price: Decimal | null
		count: number | null
	}
}

export declare interface ProductFindManyResponse extends GlobalResponse {
	data: ProductFindManyData
}

export declare interface ProductFindOneResponse extends GlobalResponse {
	data: ProductFindOneData
}

export declare interface ProductModifyResponse extends GlobalResponse {
	data: null
}
