import { PickType, IntersectionType } from '@nestjs/swagger'
import {
	ProductMVDeleteOneRequest,
	ProductMVFindManyRequest,
	ProductMVFindOneRequest,
	ArrivalProductMVCreateOneRequest,
	ArrivalProductMVUpdateOneRequest,
	ReturningProductMVCreateOneRequest,
	ReturningProductMVUpdateOneRequest,
	SellingProductMVCreateOneRequest,
	SellingProductMVUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ProductMVOptionalDto, ProductMVRequiredDto } from './fields.dtos'

export class ProductMVFindManyRequestDto
	extends IntersectionType(
		PickType(ProductMVOptionalDto, ['type', 'productId']),
		PaginationRequestDto,
		PickType(RequestOtherFieldsDto, ['isDeleted', 'search', 'startDate', 'endDate']),
	)
	implements ProductMVFindManyRequest {}

export class ProductMVFindOneRequestDto extends IntersectionType(PickType(ProductMVRequiredDto, ['id'])) implements ProductMVFindOneRequest {}

export class SellingProductMVCreateOneRequestDto
	extends IntersectionType(PickType(ProductMVRequiredDto, ['price', 'sellingId', 'count', 'productId']))
	implements SellingProductMVCreateOneRequest {}

export class arrivalProductMVCreateOneRequestDto
	extends IntersectionType(PickType(ProductMVRequiredDto, ['price', 'arrivalId', 'cost', 'count', 'productId']))
	implements ArrivalProductMVCreateOneRequest {}

export class ReturningProductMVCreateOneRequestDto
	extends IntersectionType(PickType(ProductMVRequiredDto, ['price', 'returningId', 'count', 'productId']))
	implements ReturningProductMVCreateOneRequest {}

export class SellingProductMVUpdateOneRequestDto
	extends IntersectionType(PickType(ProductMVOptionalDto, ['price', 'sellingId', 'count', 'productId']))
	implements SellingProductMVUpdateOneRequest
{
	send?: boolean
}

export class ArrivalProductMVUpdateOneRequestDto
	extends IntersectionType(PickType(ProductMVOptionalDto, ['price', 'arrivalId', 'cost', 'count', 'productId']))
	implements ArrivalProductMVUpdateOneRequest {}

export class ReturningProductMVUpdateOneRequestDto
	extends IntersectionType(PickType(ProductMVOptionalDto, ['price', 'returningId', 'count', 'productId']))
	implements ReturningProductMVUpdateOneRequest {}

export class ProductMVDeleteOneRequestDto
	extends IntersectionType(PickType(ProductMVRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ProductMVDeleteOneRequest {}
