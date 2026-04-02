import { Decimal } from '@prisma/client/runtime/library'
import { ProductMVOptional, ProductMVRequired } from '../interfaces'
import { $Enums, ServiceTypeEnum } from '@prisma/client'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, IsDecimalIntOrBigInt } from '../../../common'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator'

export class ProductMVRequiredDto extends DefaultRequiredFieldsDto implements ProductMVRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	arrivalId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	cost: Decimal

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
	productId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	returningId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	sellingId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	staffId: string

	@ApiProperty({ enum: ServiceTypeEnum })
	@IsNotEmpty()
	@IsEnum(ServiceTypeEnum)
	type: $Enums.ServiceTypeEnum

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	totalCost: Decimal

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	totalPrice: Decimal
}

export class ProductMVOptionalDto extends DefaultOptionalFieldsDto implements ProductMVOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	arrivalId?: string

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	cost?: Decimal

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsNumber()
	count?: number

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	price?: Decimal

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	productId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	returningId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	sellingId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string

	@ApiPropertyOptional({ enum: ServiceTypeEnum })
	@IsOptional()
	@IsEnum(ServiceTypeEnum)
	type?: $Enums.ServiceTypeEnum
}
