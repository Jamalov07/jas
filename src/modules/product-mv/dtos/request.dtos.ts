import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	ProductMVDeleteOneRequest,
	ProductMVFindManyRequest,
	ProductMVFindOneRequest,
	ArrivalProductMVCreateOneRequest,
	ArrivalProductMVUpdateOneRequest,
	ReturningProductMVCreateOneRequest,
	ReturningProductMVUpdateOneRequest,
	SellingProductMVCreateOneRequest,
	SellingProductMVUpdateOneRequest,
} from '../interfaces'
import { IsDecimalIntOrBigInt, PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ProductMVOptionalDto, ProductMVRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator'

export class ProductMVFindManyRequestDto
	extends IntersectionType(
		PickType(ProductMVOptionalDto, ['type', 'productId']),
		PaginationRequestDto,
		PickType(RequestOtherFieldsDto, ['isDeleted', 'search', 'startDate', 'endDate']),
	)
	implements ProductMVFindManyRequest {}

export class ProductMVFindOneRequestDto extends IntersectionType(PickType(ProductMVRequiredDto, ['id'])) implements ProductMVFindOneRequest {}

export class SellingProductMVCreateOneRequestDto implements SellingProductMVCreateOneRequest {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	sellingId: string

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

export class ArrivalProductMVCreateOneRequestDto implements ArrivalProductMVCreateOneRequest {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	arrivalId: string

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

export class ReturningProductMVCreateOneRequestDto implements ReturningProductMVCreateOneRequest {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	returningId: string

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

export class SellingProductMVUpdateOneRequestDto implements SellingProductMVUpdateOneRequest {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	sellingId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	productId?: string

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
	currencyId?: string

	send?: boolean
}

export class ArrivalProductMVUpdateOneRequestDto implements ArrivalProductMVUpdateOneRequest {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	arrivalId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	productId?: string

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsNumber()
	count?: number

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	cost?: Decimal

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	costCurrencyId?: string

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	price?: Decimal

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	priceCurrencyId?: string
}

export class ReturningProductMVUpdateOneRequestDto implements ReturningProductMVUpdateOneRequest {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	returningId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	productId?: string

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
	currencyId?: string
}

export class ProductMVDeleteOneRequestDto
	extends IntersectionType(PickType(ProductMVRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ProductMVDeleteOneRequest {}
