import { Injectable } from '@nestjs/common'
import { StatisticsRepository } from './statistics.repository'
import { createResponse } from '@common'
import { StatisticsGetAllProductMVRequest, StatisticsGetSellingPeriodStatsRequest, StatisticsGetSellingTotalStatsRequest, StatisticsClientReportRequest } from './interfaces'

@Injectable()
export class StatisticsService {
	constructor(private readonly statisticsRepository: StatisticsRepository) {}

	async getSellingPeriodStats(query: StatisticsGetSellingPeriodStatsRequest) {
		const result = await this.statisticsRepository.getSellingPeriodStats(query)
		return createResponse({ data: result, success: { messages: ['get period stats success'] } })
	}

	async getSellingTotalStats(query: StatisticsGetSellingTotalStatsRequest) {
		const result = await this.statisticsRepository.getSellingTotalStats()
		return createResponse({ data: result, success: { messages: ['get total stats success'] } })
	}

	async findManyAllProductMV(query: StatisticsGetAllProductMVRequest) {
		const items = await this.statisticsRepository.findManyAllProductMV(query)
		const count = await this.statisticsRepository.countFindManyAllProductMV(query)

		const result = query.pagination ? { totalCount: count, pagesCount: Math.ceil(count / query.pageSize), pageSize: items.length, data: items } : { data: items }

		return createResponse({ data: result, success: { messages: ['find many product mv success'] } })
	}

	async findManyProductStats(query: StatisticsGetAllProductMVRequest) {
		const products = await this.statisticsRepository.findManyProductStats(query)
		return createResponse({ data: products, success: { messages: ['find many product stats success'] } })
	}

	async findManyClientReport(query: StatisticsClientReportRequest) {
		const result = await this.statisticsRepository.findManyClientReport(query)
		return createResponse({ data: result, success: { messages: ['find many client report success'] } })
	}
}
