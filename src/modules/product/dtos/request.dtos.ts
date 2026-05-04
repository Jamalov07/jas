import { ApiProperty, ApiPropertyOptional, IntersectionType, PartialType, PickType } from '@nestjs/swagger'
import {
	ProductCreateOneRequest,
	ProductDeleteOneRequest,
	ProductFindManyRequest,
	ProductFindOneRequest,
	ProductPriceInput,
	ProductPriceUpdateInput,
	ProductPricesInput,
	ProductPricesUpdateInput,
	ProductUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto, IsDecimalIntOrBigInt } from '@common'
import { ProductOptionalDto, ProductRequiredDto } from './fields.dtos'
import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID, ValidateNested, IsBoolean } from 'class-validator'
import { Transform, Type } from 'class-transformer'
import { Decimal } from '@prisma/client/runtime/library'

export class ProductPriceInputDto implements ProductPriceInput {
	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	price: Decimal

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string
}

export class ProductPriceUpdateInputDto implements ProductPriceUpdateInput {
	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	price?: Decimal

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	currencyId?: string
}

export class ProductPricesInputDto implements ProductPricesInput {
	@ApiProperty({ type: ProductPriceInputDto })
	@IsNotEmpty()
	@ValidateNested()
	@Type(() => ProductPriceInputDto)
	cost: ProductPriceInputDto

	@ApiProperty({ type: ProductPriceInputDto })
	@IsNotEmpty()
	@ValidateNested()
	@Type(() => ProductPriceInputDto)
	selling: ProductPriceInputDto

	@ApiProperty({ type: ProductPriceInputDto })
	@IsNotEmpty()
	@ValidateNested()
	@Type(() => ProductPriceInputDto)
	wholesale: ProductPriceInputDto
}

export class ProductPricesUpdateInputDto implements ProductPricesUpdateInput {
	@ApiPropertyOptional({ type: ProductPriceUpdateInputDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ProductPriceUpdateInputDto)
	cost?: ProductPriceUpdateInputDto

	@ApiPropertyOptional({ type: ProductPriceUpdateInputDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ProductPriceUpdateInputDto)
	selling?: ProductPriceUpdateInputDto

	@ApiPropertyOptional({ type: ProductPriceUpdateInputDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ProductPriceUpdateInputDto)
	wholesale?: ProductPriceUpdateInputDto
}

export class ProductFindManySortHintDto {
	@ApiPropertyOptional({
		description: 'Agar `true` bo‘lsa, ro‘yxat oxirgi sotuv sanasi bo‘yicha tartiladi (eng yangi birinchi). Standart: faqat nom bo‘yicha A→Z (ma’lumot bazasida).',
	})
	@IsOptional()
	@Transform(({ value }) => ([false, 'false'].includes(value) ? false : [true, 'true'].includes(value) ? true : undefined))
	@IsBoolean()
	sortByLastSellingDate?: boolean
}

export class ProductFindManyRequestDto
	extends IntersectionType(PickType(ProductOptionalDto, ['name']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['isDeleted', 'search']), ProductFindManySortHintDto)
	implements ProductFindManyRequest
{
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	clientId?: string
}

export class ProductFindOneRequestDto extends IntersectionType(PickType(ProductRequiredDto, ['id'])) implements ProductFindOneRequest {}

export class ProductCreateOneRequestDto
	extends IntersectionType(PickType(ProductRequiredDto, ['name', 'count', 'minAmount']), PickType(ProductOptionalDto, ['description', 'image']))
	implements ProductCreateOneRequest
{
	@ApiProperty({ type: ProductPricesInputDto })
	@IsNotEmpty()
	@ValidateNested()
	@Type(() => ProductPricesInputDto)
	@Transform(({ value }) => {
		try {
			return typeof value === 'string' ? JSON.parse(value) : value
		} catch {
			return value
		}
	})
	@IsObject()
	prices: ProductPricesInputDto
}

export class ProductUpdateOneRequestDto
	extends IntersectionType(PickType(ProductOptionalDto, ['name', 'deletedAt', 'count', 'minAmount', 'description', 'image']))
	implements ProductUpdateOneRequest
{
	@ApiPropertyOptional({ type: ProductPricesUpdateInputDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ProductPricesUpdateInputDto)
	prices?: ProductPricesUpdateInputDto
}

export class ProductDeleteOneRequestDto
	extends IntersectionType(PickType(ProductRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ProductDeleteOneRequest {}

export class ProductCreateOne2RequestDto {
	@ApiProperty()
	@IsString()
	name: string

	@ApiProperty()
	@IsNotEmpty()
	@Transform(({ value }) => {
		const num = Number(value)
		return isNaN(num) ? value : num
	})
	@IsNumber()
	count: number

	@ApiProperty()
	@IsNotEmpty()
	@Transform(({ value }) => {
		const num = Number(value)
		return isNaN(num) ? value : num
	})
	@IsNumber()
	minAmount: number

	@ApiProperty()
	@IsString()
	description: string

	// ---- COST ----
	@ApiProperty()
	@IsNotEmpty()
	@Transform(({ value }) => {
		const num = Number(value)
		return isNaN(num) ? value : num
	})
	@IsNumber()
	prices_cost_price: number

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID('4')
	prices_cost_currencyId: string

	// ---- SELLING ----
	@ApiProperty()
	@IsNotEmpty()
	@Transform(({ value }) => {
		const num = Number(value)
		return isNaN(num) ? value : num
	})
	@IsNumber()
	prices_selling_price: number

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID('4')
	prices_selling_currencyId: string

	// ---- WHOLESALE ----
	@ApiProperty()
	@IsNotEmpty()
	@Transform(({ value }) => {
		const num = Number(value)
		return isNaN(num) ? value : num
	})
	@IsNumber()
	prices_wholesale_price?: number

	@ApiProperty()
	@IsNotEmpty()
	@IsUUID('4')
	prices_wholesale_currencyId?: string

	@ApiPropertyOptional({ type: 'string', format: 'binary', description: 'image file' })
	image?: any
}

export class ProductUpdateOne2RequestDto extends PartialType(ProductCreateOne2RequestDto) {}
