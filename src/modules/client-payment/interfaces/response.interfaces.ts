import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import type { ClientDebtByCurrency } from '../../client/interfaces'
import { ClientPaymentRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ClientPaymentMethodData {
	type: string
	currencyId: string
	amount: Decimal
}

export declare interface ClientPaymentChangeMethodData {
	type: string
	currencyId: string
	amount: Decimal
}

export declare interface ClientPaymentCalcByCurrency {
	currencyId: string
	total: Decimal
	currency: CurrencyBrief
}

export declare interface ClientPaymentFindManyData extends PaginationResponse<ClientPaymentFindOneData> {
	calcByCurrency: ClientPaymentCalcByCurrency[]
	/** Sahifa bo‘yicha: to‘lov − qaytim, valyuta bo‘yicha (aktiv valyutalar) */
	totalsByCurrency: ClientPaymentCalcByCurrency[]
}

export declare interface ClientPaymentFindOneData extends Pick<ClientPaymentRequired, 'id'> {
	/** `standalone` — `ClientPaymentModel`; `selling` — `ClientSellingPaymentModel` */
	paymentSource?: 'standalone' | 'selling'
	sellingId?: string | null
	description?: string | null
	staff?: { id: string; fullname: string; phone: string }
	client?: { id: string; fullname: string; phone: string; debtByCurrency?: ClientDebtByCurrency[] }
	/** Shu to‘lov hujjati bo‘yicha: to‘lov − qaytim, valyuta bo‘yicha */
	totalsByCurrency?: ClientPaymentCalcByCurrency[]
	paymentMethods?: ClientPaymentMethodData[]
	changeMethods?: ClientPaymentChangeMethodData[]
}

export declare interface ClientPaymentFindManyResponse extends GlobalResponse {
	data: ClientPaymentFindManyData
}

export declare interface ClientPaymentFindOneResponse extends GlobalResponse {
	data: ClientPaymentFindOneData
}

export declare interface ClientPaymentCreateOneResponse extends GlobalResponse {
	data: ClientPaymentFindOneData
}

export declare interface ClientPaymentModifyResponse extends GlobalResponse {
	data: null
}
