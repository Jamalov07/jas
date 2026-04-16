import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ReturningCalcEntry,
	ReturningChangeCalcEntry,
	ReturningCreateOneResponse,
	ReturningFindManyData,
	ReturningFindManyResponse,
	ReturningFindOneData,
	ReturningFindOneResponse,
	ReturningModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ReturningRequiredDto } from './fields.dtos'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export class ReturningCalcEntryDto implements ReturningCalcEntry {
	@ApiProperty({ enum: PaymentMethodEnum })
	type: PaymentMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal
}

export class ReturningChangeCalcEntryDto implements ReturningChangeCalcEntry {
	@ApiProperty({ enum: ChangeMethodEnum })
	type: ChangeMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal
}

export class ReturningFindOneDataDto extends PickType(ReturningRequiredDto, ['id', 'status', 'date', 'createdAt']) implements ReturningFindOneData {
	@ApiPropertyOptional()
	payment?: any

	@ApiPropertyOptional()
	products?: any[]

	@ApiPropertyOptional()
	client?: any

	@ApiPropertyOptional()
	staff?: any
}

export class ReturningFindManyDataDto extends PaginationResponseDto implements ReturningFindManyData {
	@ApiProperty({ type: ReturningFindOneDataDto, isArray: true })
	data: ReturningFindOneData[]

	@ApiProperty({ type: ReturningCalcEntryDto, isArray: true })
	calc: ReturningCalcEntry[]

	@ApiProperty({ type: ReturningChangeCalcEntryDto, isArray: true })
	changeCalc: ReturningChangeCalcEntry[]
}

export class ReturningFindManyResponseDto extends GlobalResponseDto implements ReturningFindManyResponse {
	@ApiProperty({ type: ReturningFindManyDataDto })
	data: ReturningFindManyData
}

export class ReturningFindOneResponseDto extends GlobalResponseDto implements ReturningFindOneResponse {
	@ApiProperty({ type: ReturningFindOneDataDto })
	data: ReturningFindOneData
}

export class ReturningCreateOneResponseDto extends GlobalResponseDto implements ReturningCreateOneResponse {
	@ApiProperty({ type: ReturningFindOneDataDto })
	data: ReturningFindOneData
}

export class ReturningModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ReturningModifyResponse {}
