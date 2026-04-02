import { PickType, IntersectionType } from '@nestjs/swagger'
import { PermissionCreateOneRequest, PermissionDeleteOneRequest, PermissionFindManyRequest, PermissionFindOneRequest, PermissionUpdateOneRequest } from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { PermissionOptionalDto, PermissionRequiredDto } from './fields.dtos'

export class PermissionFindManyRequestDto extends IntersectionType(PickType(PermissionOptionalDto, ['name']), PaginationRequestDto) implements PermissionFindManyRequest {}

export class PermissionFindOneRequestDto extends IntersectionType(PickType(PermissionRequiredDto, ['id'])) implements PermissionFindOneRequest {}

export class PermissionCreateOneRequestDto
	extends IntersectionType(PickType(PermissionRequiredDto, ['name']), PickType(RequestOtherFieldsDto, ['actionsToConnect']))
	implements PermissionCreateOneRequest {}

export class PermissionUpdateOneRequestDto
	extends IntersectionType(PickType(PermissionOptionalDto, ['name']), PickType(RequestOtherFieldsDto, ['actionsToConnect', 'actionsToDisconnect']))
	implements PermissionUpdateOneRequest {}

export class PermissionDeleteOneRequestDto extends IntersectionType(PickType(PermissionRequiredDto, ['id'])) implements PermissionDeleteOneRequest {}
