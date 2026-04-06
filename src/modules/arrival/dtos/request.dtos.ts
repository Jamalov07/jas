import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	ArrivalCreateOneRequest,
	ArrivalDeleteOneRequest,
	ArrivalFindManyRequest,
	ArrivalFindOneRequest,
	ArrivalPayment,
	ArrivalPaymentMethod,
	ArrivalProduct,
	ArrivalUpdateOneRequest,
} from '../interfaces'
import { IsDecimalIntOrBigInt, PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ArrivalOptionalDto, ArrivalRequiredDto } from './fields.dtos'
import { Type } from 'class-transformer'
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum } from '@prisma/client'

export class ArrivalPaymentMethodDto implements ArrivalPaymentMethod {
	@ApiProperty({ enum: PaymentMethodEnum })
	@IsNotEmpty()
	@IsEnum(PaymentMethodEnum)
	type: PaymentMethodEnum

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	amount: Decimal
}

export class ArrivalPaymentDto implements ArrivalPayment {
	@ApiPropertyOptional({ type: ArrivalPaymentMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ArrivalPaymentMethodDto)
	paymentMethods?: ArrivalPaymentMethod[]

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	description?: string
}

export class ArrivalProductDto implements ArrivalProduct {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	productId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsNumber()
	count: number

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	cost: Decimal

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	costCurrencyId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	price: Decimal

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	priceCurrencyId: string
}

export class ArrivalFindManyRequestDto
	extends IntersectionType(PickType(ArrivalOptionalDto, ['supplierId', 'staffId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search', 'endDate', 'startDate']))
	implements ArrivalFindManyRequest {}

export class ArrivalFindOneRequestDto extends IntersectionType(PickType(ArrivalRequiredDto, ['id'])) implements ArrivalFindOneRequest {}

export class ArrivalCreateOneRequestDto extends IntersectionType(PickType(ArrivalRequiredDto, ['supplierId', 'date'])) implements ArrivalCreateOneRequest {
	@ApiPropertyOptional({ type: ArrivalPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ArrivalPaymentDto)
	payment?: ArrivalPayment

	@ApiPropertyOptional({ type: ArrivalProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ArrivalProductDto)
	products?: ArrivalProduct[]
}

export class ArrivalUpdateOneRequestDto extends IntersectionType(PickType(ArrivalOptionalDto, ['deletedAt', 'supplierId', 'date'])) implements ArrivalUpdateOneRequest {
	@ApiPropertyOptional({ type: ArrivalPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ArrivalPaymentDto)
	payment?: ArrivalPayment

	@ApiPropertyOptional({ type: ArrivalProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ArrivalProductDto)
	products?: ArrivalProduct[]

	@ApiPropertyOptional({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	productIdsToRemove?: string[]
}

export class ArrivalDeleteOneRequestDto
	extends IntersectionType(PickType(ArrivalRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ArrivalDeleteOneRequest {}
