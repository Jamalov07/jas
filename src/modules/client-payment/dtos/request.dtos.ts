import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	ClientPaymentCreateOneRequest,
	ClientPaymentDeleteOneRequest,
	ClientPaymentFindManyRequest,
	ClientPaymentFindOneRequest,
	ClientPaymentUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { ClientPaymentMethodDto, ClientPaymentOptionalDto, ClientPaymentRequiredDto } from './fields.dtos'
import { IsArray, IsOptional, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class ClientPaymentFindManyRequestDto
	extends IntersectionType(PickType(ClientPaymentOptionalDto, ['staffId', 'clientId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search', 'endDate', 'startDate']))
	implements ClientPaymentFindManyRequest {}

export class ClientPaymentFindOneRequestDto extends IntersectionType(PickType(ClientPaymentRequiredDto, ['id'])) implements ClientPaymentFindOneRequest {}

export class ClientPaymentCreateOneRequestDto
	extends IntersectionType(PickType(ClientPaymentRequiredDto, ['clientId']), PickType(ClientPaymentOptionalDto, ['description']))
	implements ClientPaymentCreateOneRequest
{
	@ApiProperty({ type: ClientPaymentMethodDto, isArray: true })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ClientPaymentMethodDto)
	paymentMethods: ClientPaymentMethodDto[]
}

export class ClientPaymentUpdateOneRequestDto extends IntersectionType(PickType(ClientPaymentOptionalDto, ['deletedAt', 'description'])) implements ClientPaymentUpdateOneRequest {
	@ApiPropertyOptional({ type: ClientPaymentMethodDto, isArray: true })
	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => ClientPaymentMethodDto)
	paymentMethods?: ClientPaymentMethodDto[]
}

export class ClientPaymentDeleteOneRequestDto
	extends IntersectionType(PickType(ClientPaymentRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements ClientPaymentDeleteOneRequest {}
