import { IntersectionType, PickType } from '@nestjs/swagger'
import { ActionFindManyRequest, ActionFindOneRequest, ActionGetManyRequest, ActionGetOneRequest, ActionUpdateOneRequest } from '../interfaces'
import { ActionOptionalDto, ActionRequiredDto } from './fields.dtos'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'

export class ActionFindManyRequestDto
	extends IntersectionType(PickType(ActionOptionalDto, ['name', 'method', 'url', 'description', 'permissionId']), PaginationRequestDto)
	implements ActionFindManyRequest {}

export class ActionFindOneRequestDto extends PickType(ActionRequiredDto, ['id']) implements ActionFindOneRequest {}

export class ActionGetManyRequestDto extends IntersectionType(ActionOptionalDto, PaginationRequestDto, PickType(RequestOtherFieldsDto, ['ids'])) implements ActionGetManyRequest {}

export class ActionGetOneRequestDto extends ActionRequiredDto implements ActionGetOneRequest {}

export class ActionUpdateOneRequestDto extends PickType(ActionOptionalDto, ['description', 'permissionId']) implements ActionUpdateOneRequest {}
