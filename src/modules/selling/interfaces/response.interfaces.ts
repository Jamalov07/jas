import { GlobalResponse, PaginationResponse } from '@common'
import { SellingOptional, SellingRequired } from './fields.interfaces'
import { ClientFindOneData } from '../../client'
import { StaffFindOneData } from '../../staff'
import { Decimal } from '@prisma/client/runtime/library'
import { ProductMVFindOneData } from '../../product-mv'
import { BotSellingTitleEnum } from '../enums'
import { ClientPaymentFindOneData } from '../../client-payment'

export declare interface SellingCalc {
	totalPrice: Decimal
	totalPayment: Decimal
	totalCardPayment: Decimal
	totalCashPayment: Decimal
	totalOtherPayment: Decimal
	totalTransferPayment: Decimal
	totalDebt: Decimal
}
export declare interface SellingFindManyData extends PaginationResponse<SellingFindOneData> {
	calc: SellingCalc
}

export declare interface SellingFindOneData extends Pick<SellingRequired, 'id' | 'status' | 'createdAt' | 'date'>, Pick<SellingOptional, 'publicId'> {
	client?: ClientFindOneData
	staff?: StaffFindOneData
	debt?: Decimal
	totalPayment?: Decimal
	totalPrice?: Decimal
	products?: ProductMVFindOneData[]
	title?: BotSellingTitleEnum
	payment?: ClientPaymentFindOneData
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

export declare interface Debt {
	ourDebt: Decimal
	theirDebt: Decimal
}

export declare interface SellingGetTotalStatsData {
	daily: Decimal
	weekly: Decimal
	monthly: Decimal
	yearly: Decimal
	client: Debt
	supplier: Debt
}
export declare interface SellingGetTotalStatsResponse extends GlobalResponse {
	data: SellingGetTotalStatsData
}

export declare interface SellingGetPeriodStatsData {
	date: string
	sum: Decimal
}

export declare interface SellingGetPeriodStatsResponse extends GlobalResponse {
	data: SellingGetPeriodStatsData[]
}
