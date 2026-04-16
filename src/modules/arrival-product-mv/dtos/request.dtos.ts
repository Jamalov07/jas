import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'
import { IsDecimalIntOrBigInt, PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { IntersectionType } from '@nestjs/swagger'
import { Decimal } from '@prisma/client/runtime/library'

export class ArrivalProductMVFindManyRequestDto extends IntersectionType(PaginationRequestDto, RequestOtherFieldsDto) {
	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	arrivalId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	staffId?: string
}

export class ArrivalProductMVFindOneRequestDto {
	@ApiProperty()
	@IsUUID()
	id: string
}

export class ArrivalProductMVCreateOneRequestDto {
	@ApiProperty()
	@IsUUID()
	arrivalId: string

	@ApiProperty()
	@IsUUID()
	productId: string

	@ApiProperty()
	@IsNotEmpty()
	@IsNumber()
	@Type(() => Number)
	count: number

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	cost: Decimal

	@ApiProperty()
	@IsUUID()
	costCurrencyId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	price: Decimal

	@ApiProperty()
	@IsUUID()
	priceCurrencyId: string
}

export class ArrivalProductMVUpdateOneRequestDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	count?: number

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	cost?: Decimal

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	costCurrencyId?: string

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	price?: Decimal

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	priceCurrencyId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	arrivalId?: string
}

export class ArrivalProductMVDeleteOneRequestDto {
	@ApiProperty()
	@IsUUID()
	id: string
}
