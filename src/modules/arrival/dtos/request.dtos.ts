import { PickType, IntersectionType, ApiPropertyOptional } from '@nestjs/swagger'
import {
	ArrivalCreateOneRequest,
	ArrivalDeleteOneRequest,
	ArrivalFindManyRequest,
	ArrivalFindOneRequest,
	ArrivalPayment,
	ArrivalProduct,
	ArrivalUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ArrivalOptionalDto, ArrivalRequiredDto } from './fields.dtos'
import { Type } from 'class-transformer'
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator'
import { SupplierPaymentOptionalDto, SupplierPaymentRequiredDto } from '../../supplier-payment'
import { ProductMVRequiredDto } from '../../product-mv'

export class ArrivalFindManyRequestDto
	extends IntersectionType(PickType(ArrivalOptionalDto, ['supplierId', 'staffId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search', 'endDate', 'startDate']))
	implements ArrivalFindManyRequest {}

export class ArrivalFindOneRequestDto extends IntersectionType(PickType(ArrivalRequiredDto, ['id'])) implements ArrivalFindOneRequest {}

export class ArrivalPaymentDto
	extends IntersectionType(PickType(SupplierPaymentRequiredDto, ['card', 'cash', 'other', 'transfer']), PickType(SupplierPaymentOptionalDto, ['description']))
	implements ArrivalPayment {}

export class ArrivalProductDto extends PickType(ProductMVRequiredDto, ['count', 'price', 'cost', 'productId']) implements ArrivalProduct {}

export class ArrivalCreateOneRequestDto extends IntersectionType(PickType(ArrivalRequiredDto, ['supplierId', 'date'])) implements ArrivalCreateOneRequest {
	@ApiPropertyOptional({ type: ArrivalPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ArrivalPaymentDto)
	payment?: ArrivalPayment

	@ApiPropertyOptional({ type: ArrivalProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ArrivalProductDto)
	products?: ArrivalProduct[]
}

export class ArrivalUpdateOneRequestDto extends IntersectionType(PickType(ArrivalOptionalDto, ['deletedAt', 'supplierId', 'date'])) implements ArrivalUpdateOneRequest {
	@ApiPropertyOptional({ type: ArrivalPaymentDto })
	@IsOptional()
	@ValidateNested()
	@Type(() => ArrivalPaymentDto)
	payment?: ArrivalPayment

	@ApiPropertyOptional({ type: ArrivalProductDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ArrivalProductDto)
	products?: ArrivalProduct[]

	@ApiPropertyOptional({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	productIdsToRemove?: string[]
}

export class ArrivalDeleteOneRequestDto
	extends IntersectionType(PickType(ArrivalRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ArrivalDeleteOneRequest {}
