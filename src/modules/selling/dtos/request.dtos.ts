import { PickType, IntersectionType, ApiPropertyOptional } from '@nestjs/swagger'
import {
	SellingCreateOneRequest,
	SellingDeleteOneRequest,
	SellingFindManyRequest,
	SellingFindOneRequest,
	SellingGetPeriodStatsRequest,
	SellingGetTotalStatsRequest,
	SellingPayment,
	SellingProduct,
	SellingUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { SellingOptionalDto, SellingRequiredDto } from './fields.dtos'
import { ClientPaymentOptionalDto, ClientPaymentRequiredDto } from '../../client-payment'
import { ProductMVRequiredDto } from '../../product-mv'
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { StatsTypeEnum } from '../enums'

export class SellingFindManyRequestDto
	extends IntersectionType(
		PickType(SellingOptionalDto, ['clientId', 'staffId', 'status']),
		PaginationRequestDto,
		PickType(RequestOtherFieldsDto, ['search', 'startDate', 'endDate']),
	)
	implements SellingFindManyRequest {}

export class SellingFindOneRequestDto extends IntersectionType(PickType(SellingRequiredDto, ['id'])) implements SellingFindOneRequest {}

export class SellingPaymentDto
	extends IntersectionType(PickType(ClientPaymentRequiredDto, ['card', 'cash', 'other', 'transfer']), PickType(ClientPaymentOptionalDto, ['description']))
	implements SellingPayment {}

export class SellingProductDto extends PickType(ProductMVRequiredDto, ['count', 'price', 'productId']) implements SellingProduct {}

export class SellingCreateOneRequestDto
	extends IntersectionType(PickType(SellingRequiredDto, ['clientId', 'date', 'send']), PickType(SellingOptionalDto, ['staffId']))
	implements SellingCreateOneRequest
{
	@ApiPropertyOptional({ type: SellingPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => SellingPaymentDto)
	payment?: SellingPayment

	@ApiPropertyOptional({ type: SellingProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => SellingProductDto)
	products?: SellingProduct[]
}

export class SellingUpdateOneRequestDto
	extends IntersectionType(PickType(SellingOptionalDto, ['deletedAt', 'clientId', 'date', 'status', 'send']))
	implements SellingUpdateOneRequest
{
	@ApiPropertyOptional({ type: SellingPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => SellingPaymentDto)
	payment?: SellingPayment
}

export class SellingDeleteOneRequestDto
	extends IntersectionType(PickType(SellingRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements SellingDeleteOneRequest {}

export class SellingGetTotalStatsRequestDto implements SellingGetTotalStatsRequest {}

export class SellingGetPeriodStatsRequestDto implements SellingGetPeriodStatsRequest {
	@ApiPropertyOptional({ enum: StatsTypeEnum })
	@IsOptional()
	@IsEnum(StatsTypeEnum)
	type?: StatsTypeEnum = StatsTypeEnum.day
}
