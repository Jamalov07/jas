import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	StaffPaymentCalc,
	StaffPaymentCreateOneResponse,
	StaffPaymentFindManyData,
	StaffPaymentFindManyResponse,
	StaffPaymentFindOneData,
	StaffPaymentFindOneResponse,
	StaffPaymentModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { StaffPaymentRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'

export class StaffPaymentFindOneDataDto extends PickType(StaffPaymentRequiredDto, ['id', 'sum', 'createdAt']) implements StaffPaymentFindOneData {}

export class StaffPaymentCalcDto implements StaffPaymentCalc {
	@ApiProperty({ type: Number })
	sum: Decimal
}

export class StaffPaymentFindManyDataDto extends PaginationResponseDto implements StaffPaymentFindManyData {
	@ApiProperty({ type: StaffPaymentFindOneDataDto, isArray: true })
	data: StaffPaymentFindOneData[]

	@ApiProperty({ type: StaffPaymentCalcDto })
	calc: StaffPaymentCalc
}

export class StaffPaymentFindManyResponseDto extends GlobalResponseDto implements StaffPaymentFindManyResponse {
	@ApiProperty({ type: StaffPaymentFindManyDataDto })
	data: StaffPaymentFindManyData
}

export class StaffPaymentFindOneResponseDto extends GlobalResponseDto implements StaffPaymentFindOneResponse {
	@ApiProperty({ type: StaffPaymentFindOneDataDto })
	data: StaffPaymentFindOneData
}

export class StaffPaymentCreateOneResponseDto extends GlobalResponseDto implements StaffPaymentCreateOneResponse {
	@ApiProperty({ type: StaffPaymentFindOneDataDto })
	data: StaffPaymentFindOneData
}

export class StaffPaymentModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements StaffPaymentModifyResponse {}
