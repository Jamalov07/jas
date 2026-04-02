import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
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
import { IsDecimal, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
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

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsDecimalIntOrBigInt()
	exchangeRate: Decimal
}

export class ProductPriceUpdateInputDto implements ProductPriceUpdateInput {
	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsDecimalIntOrBigInt()
	price?: Decimal
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

export class ProductFindManyRequestDto
	extends IntersectionType(PickType(ProductOptionalDto, ['name']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['isDeleted', 'search']))
	implements ProductFindManyRequest {}

export class ProductFindOneRequestDto extends IntersectionType(PickType(ProductRequiredDto, ['id'])) implements ProductFindOneRequest {}

export class ProductCreateOneRequestDto
	extends IntersectionType(PickType(ProductRequiredDto, ['name', 'count', 'minAmount']), PickType(ProductOptionalDto, ['description']))
	implements ProductCreateOneRequest
{
	@ApiProperty({ type: ProductPricesInputDto })
	@IsNotEmpty()
	@ValidateNested()
	@Type(() => ProductPricesInputDto)
	prices: ProductPricesInputDto
}

export class ProductUpdateOneRequestDto
	extends IntersectionType(PickType(ProductOptionalDto, ['name', 'deletedAt', 'count', 'minAmount', 'description']))
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
