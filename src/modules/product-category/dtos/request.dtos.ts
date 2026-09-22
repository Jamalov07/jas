import { IntersectionType, PickType } from '@nestjs/swagger'
import {
	ProductCategoryCreateOneRequest,
	ProductCategoryDeleteOneRequest,
	ProductCategoryFindManyRequest,
	ProductCategoryFindOneRequest,
	ProductCategoryUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ProductCategoryOptionalDto, ProductCategoryRequiredDto } from './fields.dtos'

export class ProductCategoryFindManyRequestDto
	extends IntersectionType(PickType(ProductCategoryOptionalDto, ['name']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search']))
	implements ProductCategoryFindManyRequest {}

export class ProductCategoryFindOneRequestDto extends PickType(ProductCategoryRequiredDto, ['id']) implements ProductCategoryFindOneRequest {}

export class ProductCategoryCreateOneRequestDto
	extends PickType(ProductCategoryRequiredDto, ['name'])
	implements ProductCategoryCreateOneRequest {}

export class ProductCategoryUpdateOneRequestDto extends PickType(ProductCategoryOptionalDto, ['name']) implements ProductCategoryUpdateOneRequest {}

export class ProductCategoryDeleteOneRequestDto
	extends IntersectionType(PickType(ProductCategoryRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ProductCategoryDeleteOneRequest {}
