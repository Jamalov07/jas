import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, IsDecimalIntOrBigInt } from '../../../common'
import { SupplierPaymentChangeMethod, SupplierPaymentMethod, SupplierPaymentOptional, SupplierPaymentRequired } from '../interfaces'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { $Enums, ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export class SupplierPaymentMethodDto implements SupplierPaymentMethod {
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

export class SupplierPaymentChangeMethodDto implements SupplierPaymentChangeMethod {
	@ApiProperty({ enum: ChangeMethodEnum })
	@IsNotEmpty()
	@IsEnum(ChangeMethodEnum)
	type: $Enums.ChangeMethodEnum

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	amount: Decimal
}

export class SupplierPaymentRequiredDto extends DefaultRequiredFieldsDto implements SupplierPaymentRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	staffId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	supplierId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	description: string
}

export class SupplierPaymentOptionalDto extends DefaultOptionalFieldsDto implements SupplierPaymentOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	supplierId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	description?: string
}
