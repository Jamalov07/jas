import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
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
import { IsDecimalIntOrBigInt, PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { SellingOptionalDto, SellingRequiredDto } from './fields.dtos'
import { ClientPaymentOptionalDto, ClientPaymentRequiredDto } from '../../client-payment'
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { StatsTypeEnum } from '../enums'
import { Decimal } from '@prisma/client/runtime/library'

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

export class SellingProductDto implements SellingProduct {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	productId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsNumber()
	count: number

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	price: Decimal

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string
}

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
