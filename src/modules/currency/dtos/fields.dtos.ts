import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, IsDecimalIntOrBigInt } from '../../../common'
import { CurrencyOptional, CurrencyRequired } from '../interfaces'
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { Decimal } from '@prisma/client/runtime/library'

export class CurrencyRequiredDto extends DefaultRequiredFieldsDto implements CurrencyRequired {
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
}

export class CurrencyOptionalDto extends DefaultOptionalFieldsDto implements CurrencyOptional {
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
}
