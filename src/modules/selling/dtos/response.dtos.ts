import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	SellingCalcEntry,
	SellingCreateOneResponse,
	SellingFindManyData,
	SellingFindManyResponse,
	SellingFindOneData,
	SellingFindOneResponse,
	SellingModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { SellingRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum } from '@prisma/client'

export class SellingCalcEntryDto implements SellingCalcEntry {
	@ApiProperty({ enum: PaymentMethodEnum })
	type: PaymentMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal
}

export class SellingFindOneDataDto extends PickType(SellingRequiredDto, ['id', 'status', 'createdAt', 'date']) implements SellingFindOneData {
	@ApiPropertyOptional({ type: Number })
	publicId?: number

	@ApiPropertyOptional()
	client?: any

	@ApiPropertyOptional()
	staff?: any

	@ApiPropertyOptional()
	totalPrices?: any[]

	@ApiPropertyOptional()
	payment?: any

	@ApiPropertyOptional()
	products?: any[]
}

export class SellingFindManyDataDto extends PaginationResponseDto implements SellingFindManyData {
	@ApiProperty({ type: SellingFindOneDataDto, isArray: true })
	data: SellingFindOneData[]

	@ApiProperty({ type: SellingCalcEntryDto, isArray: true })
	calc: SellingCalcEntry[]
}

export class SellingFindManyResponseDto extends GlobalResponseDto implements SellingFindManyResponse {
	@ApiProperty({ type: SellingFindManyDataDto })
	data: SellingFindManyData
}

export class SellingFindOneResponseDto extends GlobalResponseDto implements SellingFindOneResponse {
	@ApiProperty({ type: SellingFindOneDataDto })
	data: SellingFindOneData
}

export class SellingCreateOneResponseDto extends GlobalResponseDto implements SellingCreateOneResponse {
	@ApiProperty({ type: SellingFindOneDataDto })
	data: SellingFindOneData
}

export class SellingModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements SellingModifyResponse {}
