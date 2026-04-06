import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, IsDecimalIntOrBigInt } from '../../../common'
import { StaffPaymentMethod, StaffPaymentOptional, StaffPaymentRequired } from '../interfaces'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { $Enums, PaymentMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export class StaffPaymentMethodDto implements StaffPaymentMethod {
	@ApiProperty({ enum: PaymentMethodEnum })
	@IsNotEmpty()
	@IsEnum(PaymentMethodEnum)
	type: $Enums.PaymentMethodEnum

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	amount: Decimal
}

export class StaffPaymentRequiredDto extends DefaultRequiredFieldsDto implements StaffPaymentRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	staffId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	employeeId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	description: string
}

export class StaffPaymentOptionalDto extends DefaultOptionalFieldsDto implements StaffPaymentOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	employeeId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	description?: string
}
