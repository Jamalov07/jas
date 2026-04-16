import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Allow, IsNumber, IsOptional, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { IntersectionType } from '@nestjs/swagger'

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
	@IsNumber()
	@Type(() => Number)
	count: number

	@Allow()
	@ApiProperty()
	price: any

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

	@ApiPropertyOptional()
	@IsOptional()
	price?: any

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
