import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { IntersectionType } from '@nestjs/swagger'

export class SellingProductMVFindManyRequestDto extends IntersectionType(PaginationRequestDto, RequestOtherFieldsDto) {
	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	sellingId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	productId?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID()
	staffId?: string
}

export class SellingProductMVFindOneRequestDto {
	@ApiProperty()
	@IsUUID()
	id: string
}

export class SellingProductMVCreateOneRequestDto {
	@ApiProperty()
	@IsUUID()
	sellingId: string

	@ApiProperty()
	@IsUUID()
	productId: string

	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	count: number

	@ApiProperty()
	@IsNumber()
	@Type(() => Number)
	price: number

	@ApiPropertyOptional({ description: 'Chegirma foizi 0–100' })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(0)
	@Max(100)
	discount?: number

	@ApiProperty()
	@IsUUID()
	currencyId: string
}

export class SellingProductMVUpdateOneRequestDto {
	@ApiPropertyOptional()
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	count?: number

	@ApiPropertyOptional()
	@IsOptional()
	price?: any

	@ApiPropertyOptional({ description: 'Chegirma foizi 0–100' })
	@IsOptional()
	@IsNumber()
	@Type(() => Number)
	@Min(0)
	@Max(100)
	discount?: number

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
	sellingId?: string
}

export class SellingProductMVDeleteOneRequestDto {
	@ApiProperty()
	@IsUUID()
	id: string
}
