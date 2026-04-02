import { PickType, IntersectionType } from '@nestjs/swagger'
import {
	SupplierPaymentCreateOneRequest,
	SupplierPaymentDeleteOneRequest,
	SupplierPaymentFindManyRequest,
	SupplierPaymentFindOneRequest,
	SupplierPaymentUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { SupplierPaymentOptionalDto, SupplierPaymentRequiredDto } from './fields.dtos'

export class SupplierPaymentFindManyRequestDto
	extends IntersectionType(PickType(SupplierPaymentOptionalDto, ['staffId', 'userId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search', 'endDate', 'startDate']))
	implements SupplierPaymentFindManyRequest {}

export class SupplierPaymentFindOneRequestDto extends IntersectionType(PickType(SupplierPaymentRequiredDto, ['id'])) implements SupplierPaymentFindOneRequest {}

export class SupplierPaymentCreateOneRequestDto
	extends IntersectionType(PickType(SupplierPaymentRequiredDto, ['userId', 'card', 'cash', 'other', 'transfer']), PickType(SupplierPaymentOptionalDto, ['description']))
	implements SupplierPaymentCreateOneRequest {}

export class SupplierPaymentUpdateOneRequestDto
	extends IntersectionType(PickType(SupplierPaymentOptionalDto, ['deletedAt', 'card', 'cash', 'other', 'transfer']), PickType(SupplierPaymentOptionalDto, ['description']))
	implements SupplierPaymentUpdateOneRequest {}

export class SupplierPaymentDeleteOneRequestDto
	extends IntersectionType(PickType(SupplierPaymentRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements SupplierPaymentDeleteOneRequest {}
