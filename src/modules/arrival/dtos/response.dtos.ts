import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ArrivalChangeCalcEntry,
	ArrivalCalcEntry,
	ArrivalCreateOneResponse,
	ArrivalFindManyData,
	ArrivalFindManyResponse,
	ArrivalFindOneData,
	ArrivalFindOneResponse,
	ArrivalModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ArrivalRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export class ArrivalCalcEntryDto implements ArrivalCalcEntry {
	@ApiProperty({ enum: PaymentMethodEnum })
	type: PaymentMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal
}

export class ArrivalChangeCalcEntryDto implements ArrivalChangeCalcEntry {
	@ApiProperty({ enum: ChangeMethodEnum })
	type: ChangeMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal
}

export class ArrivalFindOneDataDto extends PickType(ArrivalRequiredDto, ['id', 'date', 'createdAt']) implements ArrivalFindOneData {
	@ApiPropertyOptional()
	payment?: any

	@ApiPropertyOptional()
	products?: any[]

	@ApiPropertyOptional()
	supplier?: any

	@ApiPropertyOptional()
	staff?: any
}

export class ArrivalFindManyDataDto extends PaginationResponseDto implements ArrivalFindManyData {
	@ApiProperty({ type: ArrivalFindOneDataDto, isArray: true })
	data: ArrivalFindOneData[]

	@ApiPropertyOptional({ type: ArrivalCalcEntryDto, isArray: true })
	calc?: ArrivalCalcEntry[]

	@ApiPropertyOptional({ type: ArrivalChangeCalcEntryDto, isArray: true })
	changeCalc?: ArrivalChangeCalcEntry[]
}

export class ArrivalFindManyResponseDto extends GlobalResponseDto implements ArrivalFindManyResponse {
	@ApiProperty({ type: ArrivalFindManyDataDto })
	data: ArrivalFindManyData
}

export class ArrivalFindOneResponseDto extends GlobalResponseDto implements ArrivalFindOneResponse {
	@ApiProperty({ type: ArrivalFindOneDataDto })
	data: ArrivalFindOneData
}

export class ArrivalCreateOneResponseDto extends GlobalResponseDto implements ArrivalCreateOneResponse {
	@ApiProperty({ type: ArrivalFindOneDataDto })
	data: ArrivalFindOneData
}

export class ArrivalModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ArrivalModifyResponse {}
