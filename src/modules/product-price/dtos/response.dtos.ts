import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import { ProductPriceFindManyData, ProductPriceFindManyResponse, ProductPriceFindOneData, ProductPriceFindOneResponse, ProductPriceModifyResponse } from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ProductPriceRequiredDto } from './fields.dtos'

export class ProductPriceFindOneDataDto
	extends PickType(ProductPriceRequiredDto, ['id', 'type', 'price', 'totalPrice', 'productId', 'currencyId', 'exchangeRate'])
	implements ProductPriceFindOneData {}

export class ProductPriceFindManyDataDto extends PaginationResponseDto implements ProductPriceFindManyData {
	@ApiProperty({ type: ProductPriceFindOneDataDto, isArray: true })
	data: ProductPriceFindOneData[]
}

export class ProductPriceFindManyResponseDto extends GlobalResponseDto implements ProductPriceFindManyResponse {
	@ApiProperty({ type: ProductPriceFindManyDataDto })
	data: ProductPriceFindManyData
}

export class ProductPriceFindOneResponseDto extends GlobalResponseDto implements ProductPriceFindOneResponse {
	@ApiProperty({ type: ProductPriceFindOneDataDto })
	data: ProductPriceFindOneData
}

export class ProductPriceModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ProductPriceModifyResponse {}
