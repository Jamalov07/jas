import { IntersectionType, PickType } from '@nestjs/swagger'
import {
	ProductPriceCreateOneRequest,
	ProductPriceDeleteOneRequest,
	ProductPriceFindManyRequest,
	ProductPriceFindOneRequest,
	ProductPriceGetManyRequest,
	ProductPriceGetOneRequest,
	ProductPriceUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ProductPriceOptionalDto, ProductPriceRequiredDto } from './fields.dtos'

export class ProductPriceFindManyRequestDto
	extends IntersectionType(PickType(ProductPriceOptionalDto, ['productId', 'currencyId', 'type']), PaginationRequestDto)
	implements ProductPriceFindManyRequest {}

export class ProductPriceFindOneRequestDto extends PickType(ProductPriceRequiredDto, ['id']) implements ProductPriceFindOneRequest {}

export class ProductPriceGetManyRequestDto
	extends IntersectionType(ProductPriceOptionalDto, PaginationRequestDto, PickType(RequestOtherFieldsDto, ['ids']))
	implements ProductPriceGetManyRequest {}

export class ProductPriceGetOneRequestDto extends ProductPriceOptionalDto implements ProductPriceGetOneRequest {}

export class ProductPriceCreateOneRequestDto
	extends PickType(ProductPriceRequiredDto, ['type', 'price', 'totalPrice', 'productId', 'currencyId', 'exchangeRate'])
	implements ProductPriceCreateOneRequest {}

export class ProductPriceUpdateOneRequestDto
	extends PickType(ProductPriceOptionalDto, ['type', 'price', 'totalPrice', 'currencyId', 'exchangeRate'])
	implements ProductPriceUpdateOneRequest {}

export class ProductPriceDeleteOneRequestDto
	extends IntersectionType(PickType(ProductPriceRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ProductPriceDeleteOneRequest {}
