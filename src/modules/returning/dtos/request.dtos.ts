import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	ReturningChangeMethod,
	ReturningCreateOneRequest,
	ReturningDeleteOneRequest,
	ReturningFindManyRequest,
	ReturningFindOneRequest,
	ReturningPayment,
	ReturningPaymentMethod,
	ReturningProduct,
	ReturningUpdateOneRequest,
} from '../interfaces'
import { IsDecimalIntOrBigInt, PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ReturningOptionalDto, ReturningRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'
import { IsArray, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'

export class ReturningPaymentMethodDto implements ReturningPaymentMethod {
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

export class ReturningChangeMethodDto implements ReturningChangeMethod {
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

export class ReturningPaymentDto implements ReturningPayment {
	@ApiPropertyOptional({ type: ReturningPaymentMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ReturningPaymentMethodDto)
	paymentMethods?: ReturningPaymentMethod[]

	@ApiPropertyOptional({ type: ReturningChangeMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ReturningChangeMethodDto)
	changeMethods?: ReturningChangeMethod[]

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	description?: string
}

export class ReturningProductDto implements ReturningProduct {
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

export class ReturningFindManyRequestDto
	extends IntersectionType(PickType(ReturningOptionalDto, ['clientId', 'staffId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search', 'startDate', 'endDate']))
	implements ReturningFindManyRequest {}

export class ReturningFindOneRequestDto extends IntersectionType(PickType(ReturningRequiredDto, ['id'])) implements ReturningFindOneRequest {}

export class ReturningCreateOneRequestDto
	extends IntersectionType(PickType(ReturningRequiredDto, ['clientId', 'date']), PickType(ReturningOptionalDto, ['description']))
	implements ReturningCreateOneRequest
{
	@ApiPropertyOptional({ type: ReturningPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ReturningPaymentDto)
	payment?: ReturningPayment

	@ApiPropertyOptional({ type: ReturningProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ReturningProductDto)
	products?: ReturningProduct[]
}

export class ReturningUpdateOneRequestDto extends IntersectionType(PickType(ReturningOptionalDto, ['deletedAt', 'clientId', 'date', 'description'])) implements ReturningUpdateOneRequest {
	@ApiPropertyOptional({ type: ReturningPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ReturningPaymentDto)
	payment?: ReturningPayment

	@ApiPropertyOptional({ type: ReturningProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ReturningProductDto)
	products?: ReturningProduct[]

	@ApiPropertyOptional({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	productIdsToRemove?: string[]
}

export class ReturningDeleteOneRequestDto
	extends IntersectionType(PickType(ReturningRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ReturningDeleteOneRequest {}
