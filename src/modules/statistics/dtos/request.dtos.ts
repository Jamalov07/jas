import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { IntersectionType, PickType } from '@nestjs/swagger'
import { ProductMVStatsTypeEnum, StatisticsClientReportRequest } from '../interfaces'
import { StatsTypeEnum } from '../../selling/enums'

export class StatisticsGetSellingPeriodStatsRequestDto {
	@ApiProperty({ enum: StatsTypeEnum })
	@IsEnum(StatsTypeEnum)
	type: StatsTypeEnum
}

export class StatisticsGetSellingTotalStatsRequestDto {}

export class StatisticsGetAllProductMVRequestDto extends IntersectionType(PaginationRequestDto, RequestOtherFieldsDto) {
	@ApiPropertyOptional({ enum: ProductMVStatsTypeEnum })
	@IsOptional()
	@IsEnum(ProductMVStatsTypeEnum)
	type?: ProductMVStatsTypeEnum

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	staffId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	sellingId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	arrivalId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	returningId?: string
}

export class StatisticsClientReportRequestDto
	extends IntersectionType(PaginationRequestDto, PickType(RequestOtherFieldsDto, ['startDate', 'endDate', 'search']))
	implements StatisticsClientReportRequest {}
