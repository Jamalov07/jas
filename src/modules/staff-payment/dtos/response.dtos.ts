import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	StaffPaymentCalcByCurrency,
	StaffPaymentCreateOneResponse,
	StaffPaymentFindManyData,
	StaffPaymentFindManyResponse,
	StaffPaymentFindOneData,
	StaffPaymentFindOneResponse,
	StaffPaymentMethodData,
	StaffPaymentModifyResponse,
} from '../interfaces'
import { CurrencyBriefDto, GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { StaffPaymentRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'

export class StaffPaymentMethodDataDto implements StaffPaymentMethodData {
	@ApiProperty({ type: String })
	type: string

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal
}

export class StaffPaymentCalcByCurrencyDto implements StaffPaymentCalcByCurrency {
	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal

	@ApiProperty({ type: CurrencyBriefDto })
	currency: CurrencyBriefDto
}

export class StaffPaymentFindOneDataDto extends PickType(StaffPaymentRequiredDto, ['id', 'createdAt']) implements StaffPaymentFindOneData {
	@ApiProperty({ type: StaffPaymentMethodDataDto, isArray: true })
	methods?: StaffPaymentMethodData[]
}

export class StaffPaymentFindManyDataDto extends PaginationResponseDto implements StaffPaymentFindManyData {
	@ApiProperty({ type: StaffPaymentFindOneDataDto, isArray: true })
	data: StaffPaymentFindOneData[]

	@ApiProperty({ type: StaffPaymentCalcByCurrencyDto, isArray: true })
	calcByCurrency: StaffPaymentCalcByCurrency[]
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
