import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, IsDecimalIntOrBigInt } from '../../../common'
import { CurrencyOptional, CurrencyRequired } from '../interfaces'
import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Decimal } from '@prisma/client/runtime/library'

export class CurrencyRequiredDto extends PickType(DefaultRequiredFieldsDto, ['id']) implements CurrencyRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	name: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	symbol: string

	@ApiProperty({ type: Boolean })
	@IsNotEmpty()
	@IsBoolean()
	isActive: boolean

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	exchangeRate: Decimal

	@ApiProperty({ type: Date })
	@IsNotEmpty()
	@IsDateString()
	createdAt: Date
}

export class CurrencyOptionalDto extends PickType(DefaultOptionalFieldsDto, ['id']) implements CurrencyOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	name?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	symbol?: string

	@ApiPropertyOptional({ type: Boolean })
	@IsOptional()
	@IsBoolean()
	isActive?: boolean

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	exchangeRate?: Decimal

	@ApiPropertyOptional({ type: Date })
	@IsOptional()
	@IsDateString()
	createdAt?: Date
}
