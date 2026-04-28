import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import { SellingOptional, SellingRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum, PriceTypeEnum } from '@prisma/client'

export declare interface SellingPaymentMethodData {
	type: PaymentMethodEnum
	currencyId: string
	amount: Decimal
	currency: { id: string; name: string; symbol: string }
}

export declare interface SellingChangeMethodData {
	type: ChangeMethodEnum
	currencyId: string
	amount: Decimal
}

export declare interface SellingPaymentData {
	id: string
	description?: string
	paymentMethods: SellingPaymentMethodData[]
	changeMethods: SellingChangeMethodData[]
	createdAt: Date
}

/** Selling qatorida MV narxlari faqat `selling` turi — javobda obyekt ko‘rinishi */
export declare interface SellingProductSellingPrice {
	price: Decimal
	/** Foiz (0–100), 0 = chegirmasiz */
	discount: Decimal
	totalPrice: Decimal
}

export declare interface SellingProductData {
	id: string
	count: number
	createdAt: Date
	product: { id: string; name: string; createdAt: Date }
	prices: { selling: SellingProductSellingPrice | null }
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

export declare interface SellingChangeCalcEntry {
	type: ChangeMethodEnum
	currencyId: string
	total: Decimal
}

/** `findMany` joriy sahifasi bo‘yicha yig‘indilar (barcha `data` qatorlari) */
export declare interface SellingFindManyMoneyByCurrency {
	currencyId: string
	total: Decimal
	currency: { id: string; name: string; symbol: string }
}

/** To‘lov usuli + valyuta bo‘yicha (Visa $, Uzcard $, …) */
export declare interface SellingFindManyCalcPageMethod {
	type: PaymentMethodEnum
	currencyId: string
	total: Decimal
	currency: { id: string; name: string; symbol: string }
}

export declare interface SellingFindManyCalcPage {
	/** Sahifadagi barcha selling mahsulotlari `selling` narxi yig‘indisi, valyuta bo‘yicha */
	totalPrices: SellingFindManyMoneyByCurrency[]
	/** To‘lovlar (usul farqi yo‘q), valyuta bo‘yicha */
	totalPayments: SellingFindManyMoneyByCurrency[]
	/** To‘lov usuli + valyuta bo‘yicha (aktiv valyutalar × barcha `PaymentMethodEnum`) */
	totalMethods: SellingFindManyCalcPageMethod[]
	/** Har bir valyutada qolgan qarz yig‘indisi (sahifa bo‘yicha) */
	totalDebts: SellingFindManyMoneyByCurrency[]
}

export declare interface SellingFindManyData extends PaginationResponse<SellingFindOneData> {
	calc: SellingCalcEntry[]
	changeCalc: SellingChangeCalcEntry[]
	calcPage: SellingFindManyCalcPage
}

/** `findOne` / `findMany` data qatoridagi hujjat bo‘yicha qarz (valyuta obyekti bilan) */
export declare interface SellingDebtByCurrencyRow {
	currencyId: string
	amount: Decimal
	currency: CurrencyBrief
}

export declare interface SellingFindOneData extends Pick<SellingRequired, 'id' | 'status' | 'createdAt' | 'date'>, Pick<SellingOptional, 'publicId' | 'description'> {
	client?: any
	staff?: any
	/** Hujjat bo‘yicha qoldiq qarz, valyuta bo‘yicha */
	debtByCurrency?: SellingDebtByCurrencyRow[]
	totalPrices?: SellingTotalByCurrency[]
	/** Barcha to'lov usullari (turi farqi yo'q) valyuta bo'yicha yig'indisi */
	totalPayments?: Array<{ currencyId: string; total: Decimal; currency: { id: string; name: string; symbol: string } }>
	/** Qaytimlar valyuta bo'yicha yig'indisi */
	totalChanges?: Array<{ currencyId: string; total: Decimal; currency: { id: string; name: string; symbol: string } }>
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
