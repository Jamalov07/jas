import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'
import { IsDecimalIntOrBigInt, PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { IntersectionType } from '@nestjs/swagger'
import { Decimal } from '@prisma/client/runtime/library'

export class ReturningProductMVFindManyRequestDto extends IntersectionType(PaginationRequestDto, RequestOtherFieldsDto) {
	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	returningId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	staffId?: string
}

export class ReturningProductMVFindOneRequestDto {
	@ApiProperty()
	@IsUUID()
	id: string
}

export class ReturningProductMVCreateOneRequestDto {
	@ApiProperty()
	@IsUUID()
	returningId: string

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
	price: Decimal

	@ApiProperty()
	@IsUUID()
	currencyId: string
}

export class ReturningProductMVUpdateOneRequestDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	count?: number

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	price?: Decimal

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	currencyId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	returningId?: string
}

export class ReturningProductMVDeleteOneRequestDto {
	@ApiProperty()
	@IsUUID()
	id: string
}
