import { PickType, IntersectionType, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
	StaffPaymentCreateOneRequest,
	StaffPaymentDeleteOneRequest,
	StaffPaymentFindManyRequest,
	StaffPaymentFindOneRequest,
	StaffPaymentMethod,
	StaffPaymentUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { StaffPaymentMethodDto, StaffPaymentOptionalDto, StaffPaymentRequiredDto } from './fields.dtos'
import { IsObject, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class StaffPaymentFindManyRequestDto
	extends IntersectionType(PickType(StaffPaymentOptionalDto, ['staffId', 'employeeId']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['startDate', 'endDate']))
	implements StaffPaymentFindManyRequest {}

export class StaffPaymentFindOneRequestDto extends IntersectionType(PickType(StaffPaymentRequiredDto, ['id'])) implements StaffPaymentFindOneRequest {}

export class StaffPaymentCreateOneRequestDto extends IntersectionType(PickType(StaffPaymentRequiredDto, ['employeeId', 'description'])) implements StaffPaymentCreateOneRequest {
	@ApiProperty({ type: StaffPaymentMethodDto })
	@IsObject()
	@Type(() => StaffPaymentMethodDto)
	method: StaffPaymentMethod
}

export class StaffPaymentUpdateOneRequestDto extends IntersectionType(PickType(StaffPaymentOptionalDto, ['deletedAt', 'description'])) implements StaffPaymentUpdateOneRequest {
	@ApiPropertyOptional({ type: StaffPaymentMethodDto })
	@IsObject()
	@IsOptional()
	@Type(() => StaffPaymentMethodDto)
	method?: StaffPaymentMethodDto
}

export class StaffPaymentDeleteOneRequestDto
	extends IntersectionType(PickType(StaffPaymentRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements StaffPaymentDeleteOneRequest {}
