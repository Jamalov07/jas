import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ProductCategoryFindManyData,
	ProductCategoryFindManyResponse,
	ProductCategoryFindOneData,
	ProductCategoryFindOneResponse,
	ProductCategoryModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ProductCategoryRequiredDto } from './fields.dtos'

export class ProductCategoryFindOneDataDto
	extends PickType(ProductCategoryRequiredDto, ['id', 'name', 'createdAt'])
	implements ProductCategoryFindOneData {}

export class ProductCategoryFindManyDataDto extends PaginationResponseDto implements ProductCategoryFindManyData {
	@ApiProperty({ type: ProductCategoryFindOneDataDto, isArray: true })
	data: ProductCategoryFindOneData[]
}

export class ProductCategoryFindManyResponseDto extends GlobalResponseDto implements ProductCategoryFindManyResponse {
	@ApiProperty({ type: ProductCategoryFindManyDataDto })
	data: ProductCategoryFindManyData
}

export class ProductCategoryFindOneResponseDto extends GlobalResponseDto implements ProductCategoryFindOneResponse {
	@ApiProperty({ type: ProductCategoryFindOneDataDto })
	data: ProductCategoryFindOneData
}

export class ProductCategoryModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ProductCategoryModifyResponse {}
