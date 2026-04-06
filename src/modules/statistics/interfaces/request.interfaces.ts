import { PaginationRequest, RequestOtherFields } from '@common'
import { StatsTypeEnum } from '../../selling/enums'

export enum ProductMVStatsTypeEnum {
	selling = 'selling',
	arrival = 'arrival',
	returning = 'returning',
}

export declare interface StatisticsGetSellingPeriodStatsRequest {
	type: StatsTypeEnum
}

export declare interface StatisticsGetSellingTotalStatsRequest {}

export declare interface StatisticsGetAllProductMVRequest extends PaginationRequest, Pick<RequestOtherFields, 'startDate' | 'endDate'> {
	type?: ProductMVStatsTypeEnum
	productId?: string
	staffId?: string
	sellingId?: string
	arrivalId?: string
	returningId?: string
}

export declare interface StatisticsClientReportRequest extends PaginationRequest, Pick<RequestOtherFields, 'startDate' | 'endDate' | 'search'> {}
