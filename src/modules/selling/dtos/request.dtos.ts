import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	SellingChangeMethod,
	SellingCreateOneRequest,
	SellingDeleteOneRequest,
	SellingFindManyRequest,
	SellingFindOneRequest,
	SellingPayment,
	SellingPaymentMethod,
	SellingProduct,
	SellingUpdateOneRequest,
} from '../interfaces'
import { IsDecimalIntOrBigInt, PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { SellingOptionalDto, SellingRequiredDto } from './fields.dtos'
import { ArrayNotEmpty, IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Decimal } from '@prisma/client/runtime/library'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export class SellingPaymentMethodDto implements SellingPaymentMethod {
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

export class SellingChangeMethodDto implements SellingChangeMethod {
	@ApiProperty({ enum: ChangeMethodEnum })
	@IsNotEmpty()
	@IsEnum(ChangeMethodEnum)
	type: ChangeMethodEnum

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	amount: Decimal
}

export class SellingPaymentDto implements SellingPayment {
	@ApiPropertyOptional({ type: SellingPaymentMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SellingPaymentMethodDto)
	paymentMethods?: SellingPaymentMethod[]

	@ApiPropertyOptional({ type: SellingChangeMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SellingChangeMethodDto)
	changeMethods?: SellingChangeMethod[]

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	description?: string
}

export class SellingProductDto implements SellingProduct {
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
	price: Decimal

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string
}

export class SellingFindManyRequestDto
	extends IntersectionType(
		PickType(SellingOptionalDto, ['clientId', 'staffId', 'status']),
		PaginationRequestDto,
		PickType(RequestOtherFieldsDto, ['search', 'startDate', 'endDate']),
	)
	implements SellingFindManyRequest {}

export class SellingFindOneRequestDto extends IntersectionType(PickType(SellingRequiredDto, ['id'])) implements SellingFindOneRequest {}

export class SellingCreateOneRequestDto
	extends IntersectionType(PickType(SellingRequiredDto, ['clientId', 'date']), PickType(SellingOptionalDto, ['staffId']))
	implements SellingCreateOneRequest
{
	@ApiPropertyOptional({ type: SellingPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => SellingPaymentDto)
	payment?: SellingPayment

	@ApiPropertyOptional({ type: SellingProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ArrayNotEmpty()
	@ValidateNested({ each: true })
	@Type(() => SellingProductDto)
	products?: SellingProduct[]

	@ApiPropertyOptional({ type: Boolean })
	@IsOptional()
	@IsBoolean()
	send?: boolean
}

export class SellingUpdateOneRequestDto extends IntersectionType(PickType(SellingOptionalDto, ['deletedAt', 'clientId', 'date', 'status'])) implements SellingUpdateOneRequest {
	@ApiPropertyOptional({ type: SellingPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => SellingPaymentDto)
	payment?: SellingPayment

	@ApiPropertyOptional({ type: Boolean })
	@IsOptional()
	@IsBoolean()
	send?: boolean
}

export class SellingDeleteOneRequestDto
	extends IntersectionType(PickType(SellingRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements SellingDeleteOneRequest {}
