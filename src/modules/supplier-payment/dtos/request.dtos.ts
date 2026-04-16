import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	SupplierPaymentCreateOneRequest,
	SupplierPaymentDeleteOneRequest,
	SupplierPaymentFindManyRequest,
	SupplierPaymentFindOneRequest,
	SupplierPaymentUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { SupplierPaymentChangeMethodDto, SupplierPaymentMethodDto, SupplierPaymentOptionalDto, SupplierPaymentRequiredDto } from './fields.dtos'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class SupplierPaymentFindManyRequestDto
	extends IntersectionType(
		PickType(SupplierPaymentOptionalDto, ['staffId', 'supplierId']),
		PaginationRequestDto,
		PickType(RequestOtherFieldsDto, ['search', 'endDate', 'startDate']),
	)
	implements SupplierPaymentFindManyRequest {}

export class SupplierPaymentFindOneRequestDto extends IntersectionType(PickType(SupplierPaymentRequiredDto, ['id'])) implements SupplierPaymentFindOneRequest {}

export class SupplierPaymentCreateOneRequestDto
	extends IntersectionType(PickType(SupplierPaymentRequiredDto, ['supplierId']), PickType(SupplierPaymentOptionalDto, ['description']))
	implements SupplierPaymentCreateOneRequest
{
	@ApiProperty({ type: SupplierPaymentMethodDto, isArray: true })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SupplierPaymentMethodDto)
	paymentMethods: SupplierPaymentMethodDto[]

	@ApiPropertyOptional({ type: SupplierPaymentChangeMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SupplierPaymentChangeMethodDto)
	changeMethods?: SupplierPaymentChangeMethodDto[]
}

export class SupplierPaymentUpdateOneRequestDto
	extends IntersectionType(PickType(SupplierPaymentOptionalDto, ['deletedAt', 'description']))
	implements SupplierPaymentUpdateOneRequest
{
	@ApiPropertyOptional({ type: SupplierPaymentMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SupplierPaymentMethodDto)
	paymentMethods?: SupplierPaymentMethodDto[]

	@ApiPropertyOptional({ type: SupplierPaymentChangeMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => SupplierPaymentChangeMethodDto)
	changeMethods?: SupplierPaymentChangeMethodDto[]
}

export class SupplierPaymentDeleteOneRequestDto
	extends IntersectionType(PickType(SupplierPaymentRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements SupplierPaymentDeleteOneRequest {}
