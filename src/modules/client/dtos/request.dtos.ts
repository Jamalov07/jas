import { PickType, IntersectionType, ApiPropertyOptional } from '@nestjs/swagger'
import { ClientCreateOneRequest, ClientDeleteOneRequest, ClientFindManyRequest, ClientFindOneRequest, ClientUpdateOneRequest } from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ClientOptionalDto, ClientRequiredDto } from './fields.dtos'
import { IsDateString, IsOptional } from 'class-validator'

export class ClientFindManyRequestDto
	extends IntersectionType(
		PickType(ClientOptionalDto, ['fullname', 'phone']),
		PaginationRequestDto,
		PickType(RequestOtherFieldsDto, ['search', 'debtValue', 'debtType', 'startDate', 'endDate']),
	)
	implements ClientFindManyRequest {}

export class ClientFindOneRequestDto extends IntersectionType(PickType(ClientRequiredDto, ['id'])) implements ClientFindOneRequest {
	@ApiPropertyOptional({ description: 'Start date in ISO format (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	deedStartDate?: Date

	@ApiPropertyOptional({ description: 'End date in ISO format (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	deedEndDate?: Date
}

export class ClientCreateOneRequestDto
	extends IntersectionType(PickType(ClientRequiredDto, ['fullname', 'phone']), PickType(ClientOptionalDto, ['description']))
	implements ClientCreateOneRequest {}

export class ClientUpdateOneRequestDto extends IntersectionType(PickType(ClientOptionalDto, ['deletedAt', 'fullname', 'phone', 'description'])) implements ClientUpdateOneRequest {}

export class ClientDeleteOneRequestDto
	extends IntersectionType(PickType(ClientRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ClientDeleteOneRequest {}
