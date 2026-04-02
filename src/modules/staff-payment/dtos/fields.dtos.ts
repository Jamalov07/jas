import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, IsDecimalIntOrBigInt } from '../../../common'
import { StaffPaymentOptional, StaffPaymentRequired } from '../interfaces'
import { IsDecimal, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { Decimal } from '@prisma/client/runtime/library'

export class StaffPaymentRequiredDto extends DefaultRequiredFieldsDto implements StaffPaymentRequired {
	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	total: Decimal

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	sum: Decimal

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	staffId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	userId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	description: string
}

export class StaffPaymentOptionalDto extends DefaultOptionalFieldsDto implements StaffPaymentOptional {
	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	sum?: Decimal

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	userId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	description?: string
}
