import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	SellingCalcEntry,
	SellingChangeCalcEntry,
	SellingCreateOneResponse,
	SellingFindManyCalcPage,
	SellingFindManyData,
	SellingFindManyMoneyByCurrency,
	SellingFindManyResponse,
	SellingFindManyCalcPageMethod,
	SellingFindOneData,
	SellingFindOneResponse,
	SellingModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { SellingRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export class SellingCalcEntryDto implements SellingCalcEntry {
	@ApiProperty({ enum: PaymentMethodEnum })
	type: PaymentMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal
}

export class SellingChangeCalcEntryDto implements SellingChangeCalcEntry {
	@ApiProperty({ enum: ChangeMethodEnum })
	type: ChangeMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal
}

export class SellingFindManyMoneyByCurrencyDto implements SellingFindManyMoneyByCurrency {
	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal

	@ApiProperty()
	currency: { id: string; name: string; symbol: string }
}

export class SellingFindManyCalcPageMethodDto implements SellingFindManyCalcPageMethod {
	@ApiProperty({ enum: PaymentMethodEnum })
	type: PaymentMethodEnum

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal

	@ApiProperty()
	currency: { id: string; name: string; symbol: string }
}

export class SellingFindManyCalcPageDto implements SellingFindManyCalcPage {
	@ApiProperty({ type: SellingFindManyMoneyByCurrencyDto, isArray: true })
	totalPrices: SellingFindManyMoneyByCurrency[]

	@ApiProperty({ type: SellingFindManyMoneyByCurrencyDto, isArray: true })
	totalPayments: SellingFindManyMoneyByCurrency[]

	@ApiProperty({ type: SellingFindManyCalcPageMethodDto, isArray: true })
	totalMethods: SellingFindManyCalcPageMethod[]

	@ApiProperty({ type: SellingFindManyMoneyByCurrencyDto, isArray: true })
	totalDebts: SellingFindManyMoneyByCurrency[]
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

	@ApiProperty({ type: SellingChangeCalcEntryDto, isArray: true })
	changeCalc: SellingChangeCalcEntry[]

	@ApiProperty({ type: SellingFindManyCalcPageDto })
	calcPage: SellingFindManyCalcPage
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
