import { PickType, IntersectionType } from '@nestjs/swagger'
import { StaffPaymentCreateOneRequest, StaffPaymentDeleteOneRequest, StaffPaymentFindManyRequest, StaffPaymentFindOneRequest, StaffPaymentUpdateOneRequest } from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { StaffPaymentOptionalDto, StaffPaymentRequiredDto } from './fields.dtos'

export class StaffPaymentFindManyRequestDto
	extends IntersectionType(PickType(StaffPaymentOptionalDto, ['staffId', 'userId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['startDate', 'endDate']))
	implements StaffPaymentFindManyRequest {}

export class StaffPaymentFindOneRequestDto extends IntersectionType(PickType(StaffPaymentRequiredDto, ['id'])) implements StaffPaymentFindOneRequest {}

export class StaffPaymentCreateOneRequestDto
	extends IntersectionType(PickType(StaffPaymentRequiredDto, ['userId', 'sum', 'description']))
	implements StaffPaymentCreateOneRequest {}

export class StaffPaymentUpdateOneRequestDto
	extends IntersectionType(PickType(StaffPaymentOptionalDto, ['deletedAt', 'sum', 'description']))
	implements StaffPaymentUpdateOneRequest {}

export class StaffPaymentDeleteOneRequestDto
	extends IntersectionType(PickType(StaffPaymentRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements StaffPaymentDeleteOneRequest {}
