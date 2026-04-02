import { PickType, IntersectionType } from '@nestjs/swagger'
import { StaffCreateOneRequest, StaffDeleteOneRequest, StaffFindManyRequest, StaffFindOneRequest, StaffUpdateOneRequest } from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { StaffOptionalDto, StaffRequiredDto } from './fields.dtos'

export class StaffFindManyRequestDto
	extends IntersectionType(PickType(StaffOptionalDto, ['fullname', 'phone']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search']))
	implements StaffFindManyRequest {}

export class StaffFindOneRequestDto extends IntersectionType(PickType(StaffRequiredDto, ['id'])) implements StaffFindOneRequest {}

export class StaffCreateOneRequestDto
	extends IntersectionType(PickType(StaffRequiredDto, ['fullname', 'phone', 'password']), PickType(RequestOtherFieldsDto, ['actionsToConnect', 'pagesToConnect']))
	implements StaffCreateOneRequest {}

export class StaffUpdateOneRequestDto
	extends IntersectionType(
		PickType(StaffOptionalDto, ['deletedAt', 'fullname', 'password', 'phone', 'token']),
		PickType(RequestOtherFieldsDto, ['actionsToConnect', 'actionsToDisconnect', 'pagesToConnect', 'pagesToDisconnect']),
	)
	implements StaffUpdateOneRequest {}

export class StaffDeleteOneRequestDto extends IntersectionType(PickType(StaffRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method'])) implements StaffDeleteOneRequest {}
