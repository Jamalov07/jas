import { $Enums, PriceTypeEnum } from '@prisma/client'
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, IsDecimalIntOrBigInt } from '../../../common'
import { ProductPriceOptional, ProductPriceRequired } from '../interfaces'
import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator'
import { Decimal } from '@prisma/client/runtime/library'

export class ProductPriceRequiredDto extends PickType(DefaultRequiredFieldsDto, ['id']) implements ProductPriceRequired {
	@ApiProperty({ enum: PriceTypeEnum })
	@IsNotEmpty()
	@IsEnum(PriceTypeEnum)
	type: $Enums.PriceTypeEnum

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	price: Decimal

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	totalPrice: Decimal

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	productId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	exchangeRate: Decimal
}

export class ProductPriceOptionalDto extends PickType(DefaultOptionalFieldsDto, ['id']) implements ProductPriceOptional {
	@ApiPropertyOptional({ enum: PriceTypeEnum })
	@IsOptional()
	@IsEnum(PriceTypeEnum)
	type?: $Enums.PriceTypeEnum

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	price?: Decimal

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	totalPrice?: Decimal

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	productId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	currencyId?: string

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	exchangeRate?: Decimal
}
