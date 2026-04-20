import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	StatisticsGetSellingPeriodStatsRequestDto,
	StatisticsGetSellingTotalStatsRequestDto,
	StatisticsGetAllProductMVRequestDto,
	StatisticsGetSellingPeriodStatsResponseDto,
	StatisticsGetSellingTotalStatsResponseDto,
	StatisticsGetAllProductMVResponseDto,
	StatisticsClientReportRequestDto,
	StatisticsDashboardSummaryRequestDto,
	StatisticsDashboardSummaryResponseDto,
} from './dtos'
import { StatisticsService } from './statistics.service'
import { AuthOptions, CheckPermissionGuard } from '../../common'

@ApiTags('Statistics')
@Controller('statistics')
@UseGuards(CheckPermissionGuard)
export class StatisticsController {
	constructor(private readonly statisticsService: StatisticsService) {}

	@Get('selling/period')
	@ApiOkResponse({ type: StatisticsGetSellingPeriodStatsResponseDto })
	@ApiOperation({ summary: 'get selling period stats (day/week/month/year)' })
	@AuthOptions(false, false)
	async getSellingPeriodStats(@Query() query: StatisticsGetSellingPeriodStatsRequestDto): Promise<StatisticsGetSellingPeriodStatsResponseDto> {
		return this.statisticsService.getSellingPeriodStats(query)
	}

	@Get('selling/total')
	@ApiOkResponse({ type: StatisticsGetSellingTotalStatsResponseDto })
	@ApiOperation({ summary: 'get selling total stats (daily + weekly + monthly + yearly)' })
	@AuthOptions(false, false)
	async getSellingTotalStats(@Query() query: StatisticsGetSellingTotalStatsRequestDto): Promise<StatisticsGetSellingTotalStatsResponseDto> {
		return this.statisticsService.getSellingTotalStats(query)
	}

	@Get('product-mv')
	@ApiOkResponse({ type: StatisticsGetAllProductMVResponseDto })
	@ApiOperation({ summary: 'get all product movements across types (selling/arrival/returning)' })
	async findManyAllProductMV(@Query() query: StatisticsGetAllProductMVRequestDto): Promise<StatisticsGetAllProductMVResponseDto> {
		return this.statisticsService.findManyAllProductMV(query)
	}

	@Get('many-product-stats')
	@ApiOkResponse({ type: null })
	@ApiOperation({ summary: 'get aggregated product stats across all movement types' })
	@AuthOptions(false, false)
	async findManyProductStats(@Query() query: StatisticsGetAllProductMVRequestDto): Promise<any> {
		return await this.statisticsService.findManyProductStats({ ...query, pagination: false })
	}

	@Get('client-report')
	@ApiOkResponse({ type: null })
	@ApiOperation({ summary: 'get client report with selling / payment / returning stats per client' })
	@AuthOptions(false, false)
	async findManyClientReport(@Query() query: StatisticsClientReportRequestDto): Promise<any> {
		return this.statisticsService.findManyClientReport(query)
	}

	@Get('dashboard-summary')
	@ApiOkResponse({ type: StatisticsDashboardSummaryResponseDto })
	@ApiOperation({ summary: 'Umumiy dashboard: sotuv (foyda, summa, son), mijozdan qaytarish, kirim to‘lovlar — startDate/endDate' })
	@AuthOptions(false, false)
	async getDashboardSummary(@Query() query: StatisticsDashboardSummaryRequestDto): Promise<StatisticsDashboardSummaryResponseDto> {
		return this.statisticsService.getDashboardSummary(query)
	}
}
