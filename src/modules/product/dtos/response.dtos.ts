import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ProductFindManyCalc,
	ProductFindManyData,
	ProductFindManyResponse,
	ProductFindOneData,
	ProductFindOneResponse,
	ProductModifyResponse,
	ProductPriceData,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ProductRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'
import { PriceTypeEnum } from '@prisma/client'

export class ProductPriceDataDto implements ProductPriceData {
	@ApiProperty({ type: String })
	id: string

	@ApiProperty({ enum: PriceTypeEnum })
	type: PriceTypeEnum

	@ApiProperty({ type: Number })
	price: Decimal

	@ApiProperty({ type: Number })
	totalPrice: Decimal

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	exchangeRate: Decimal
}

export class ProductFindOneDataDto extends PickType(ProductRequiredDto, ['id', 'name', 'createdAt', 'description', 'count', 'minAmount']) implements ProductFindOneData {
	@ApiProperty({})
	prices: Record<PriceTypeEnum, ProductPriceData>

	@ApiPropertyOptional({ type: Date })
	lastSellingDate?: Date

	@ApiPropertyOptional({ type: Number })
	lastSellingCount?: number

	@ApiPropertyOptional({ type: Number })
	lastSellingPrice?: Decimal
}

export class ProductFindManyCalcDto implements ProductFindManyCalc {
	@ApiProperty({ type: Number })
	totalCost: Decimal

	@ApiProperty({ type: Number })
	totalPrice: Decimal

	@ApiProperty({ type: Number })
	totalCount: Decimal
}

export class ProductFindManyCalcBundleDto {
	@ApiProperty({ type: ProductFindManyCalcDto })
	calcPage: ProductFindManyCalcDto

	@ApiProperty({ type: ProductFindManyCalcDto })
	calcTotal: ProductFindManyCalcDto
}

export class ProductFindManyDataDto extends PaginationResponseDto implements ProductFindManyData {
	@ApiProperty({ type: ProductFindOneDataDto, isArray: true })
	data: ProductFindOneData[]

	@ApiProperty({ type: ProductFindManyCalcBundleDto })
	calc: { calcPage: ProductFindManyCalc; calcTotal: ProductFindManyCalc }
}

export class ProductFindManyResponseDto extends GlobalResponseDto implements ProductFindManyResponse {
	@ApiProperty({ type: ProductFindManyDataDto })
	data: ProductFindManyData
}

export class ProductFindOneResponseDto extends GlobalResponseDto implements ProductFindOneResponse {
	@ApiProperty({ type: ProductFindOneDataDto })
	data: ProductFindOneData
}

export class ProductModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ProductModifyResponse {}
