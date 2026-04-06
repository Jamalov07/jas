import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { IntersectionType } from '@nestjs/swagger'

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
	@IsNumber()
	@Type(() => Number)
	count: number

	@ApiProperty()
	cost: any

	@ApiProperty()
	@IsUUID()
	costCurrencyId: string

	@ApiProperty()
	price: any

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

	@ApiPropertyOptional()
	@IsOptional()
	cost?: any

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	costCurrencyId?: string

	@ApiPropertyOptional()
	@IsOptional()
	price?: any

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
