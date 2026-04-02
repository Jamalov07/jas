import { PickType, IntersectionType } from '@nestjs/swagger'
import {
	ClientPaymentCreateOneRequest,
	ClientPaymentDeleteOneRequest,
	ClientPaymentFindManyRequest,
	ClientPaymentFindOneRequest,
	ClientPaymentUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ClientPaymentOptionalDto, ClientPaymentRequiredDto } from './fields.dtos'

export class ClientPaymentFindManyRequestDto
	extends IntersectionType(PickType(ClientPaymentOptionalDto, ['staffId', 'userId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search', 'endDate', 'startDate']))
	implements ClientPaymentFindManyRequest {}

export class ClientPaymentFindOneRequestDto extends IntersectionType(PickType(ClientPaymentRequiredDto, ['id'])) implements ClientPaymentFindOneRequest {}

export class ClientPaymentCreateOneRequestDto
	extends IntersectionType(PickType(ClientPaymentRequiredDto, ['userId', 'card', 'cash', 'other', 'transfer']), PickType(ClientPaymentOptionalDto, ['description']))
	implements ClientPaymentCreateOneRequest {}

export class ClientPaymentUpdateOneRequestDto
	extends IntersectionType(PickType(ClientPaymentOptionalDto, ['deletedAt', 'card', 'description', 'cash', 'other', 'transfer']))
	implements ClientPaymentUpdateOneRequest {}

export class ClientPaymentDeleteOneRequestDto
	extends IntersectionType(PickType(ClientPaymentRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ClientPaymentDeleteOneRequest {}
