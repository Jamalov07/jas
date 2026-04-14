import { CurrencyBrief, GlobalResponse, PaginationResponse } from '@common'
import { ClientRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ClientDebtByCurrency {
	currencyId: string
	amount: Decimal
	currency: CurrencyBrief
}

export declare interface ClientDeed {
	type: 'debit' | 'credit'
	action: 'selling' | 'payment' | 'returning' | 'change'
	date: Date
	value: Decimal
	description: string
	currencyId?: string
}

export declare interface ClientDeedInfo {
	deeds: ClientDeed[]
	totalCreditByCurrency: ClientDebtByCurrency[]
	totalDebitByCurrency: ClientDebtByCurrency[]
	debtByCurrency: ClientDebtByCurrency[]
}

export declare interface ClientFindManyData extends PaginationResponse<ClientFindOneData> {}

export declare interface ClientFindOneData extends Pick<ClientRequired, 'id' | 'fullname' | 'createdAt' | 'phone'> {
	debtByCurrency?: ClientDebtByCurrency[]
	lastSellingDate?: Date
	deedInfo?: ClientDeedInfo
	telegram?: { id?: string; isActive?: boolean }
}

export declare interface ClientFindManyResponse extends GlobalResponse {
	data: ClientFindManyData
}

export declare interface ClientFindOneResponse extends GlobalResponse {
	data: ClientFindOneData
}

export declare interface ClientCreateOneResponse extends GlobalResponse {
	data: ClientFindOneData
}

export declare interface ClientModifyResponse extends GlobalResponse {
	data: null
}

export interface ClientCalc {
	selling: {
		count: number
		totalPrice: number
		payment: {
			count: number
			total: number
		}
	}
	returning: {
		count: number
		totalPrice: number
	}
}
