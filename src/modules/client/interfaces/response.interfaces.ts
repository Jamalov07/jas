import { GlobalResponse, PaginationResponse } from '@common'
import { ClientRequired } from './fields.interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export declare interface ClientDeed {
	type: 'debit' | 'credit'
	action: 'selling' | 'payment' | 'returning' | 'arrival'
	date: Date
	value: Decimal
	description: string
}

export declare interface ClientDeedInfo {
	deeds: ClientDeed[]
	totalCredit: Decimal
	totalDebit: Decimal
	debt: Decimal
}

export declare interface ClientFindManyData extends PaginationResponse<ClientFindOneData> {}

export declare interface ClientFindOneData extends Pick<ClientRequired, 'id' | 'fullname' | 'createdAt' | 'phone'> {
	debt?: Decimal
	lastArrivalDate?: Date
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
			totalCard: number
			totalCash: number
			totalTransfer: number
			totalOther: number
		}
	}
	returning: {
		count: number
		totalPrice: number
		payment: {
			totalFromBalance: number
			totalCash: number
		}
	}
}
