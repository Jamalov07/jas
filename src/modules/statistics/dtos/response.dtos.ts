import { GlobalResponse } from '@common'
import { ApiProperty } from '@nestjs/swagger'

export class StatisticsGetSellingPeriodStatsResponseDto implements GlobalResponse {
	success: any
	data: any
}

export class StatisticsGetSellingTotalStatsResponseDto implements GlobalResponse {
	success: any
	data: any
}

export class StatisticsGetAllProductMVResponseDto implements GlobalResponse {
	success: any
	data: any
}

export class StatisticsDashboardSummaryResponseDto implements GlobalResponse {
	success: any

	@ApiProperty({
		description: 'Sotuv / qaytarish / kirim to‘lovlari — summalar valyuta bo‘yicha (UZS va boshqalar)',
	})
	data: any
}
