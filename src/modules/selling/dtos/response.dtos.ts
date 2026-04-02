import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	Debt,
	SellingCalc,
	SellingCreateOneResponse,
	SellingFindManyData,
	SellingFindManyResponse,
	SellingFindOneData,
	SellingFindOneResponse,
	SellingGetPeriodStatsData,
	SellingGetPeriodStatsResponse,
	SellingGetTotalStatsData,
	SellingGetTotalStatsResponse,
	SellingModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { SellingRequiredDto } from './fields.dtos'
import { ClientFindOneData, ClientFindOneDataDto } from '../../client'
import { StaffFindOneData, StaffFindOneDataDto } from '../../staff'
import { Decimal } from '@prisma/client/runtime/library'

export class SellingFindOneDataDto extends PickType(SellingRequiredDto, ['id', 'status', 'createdAt', 'date', 'send', 'sended']) implements SellingFindOneData {
	@ApiProperty({ type: ClientFindOneDataDto })
	client?: ClientFindOneData

	@ApiProperty({ type: StaffFindOneDataDto })
	staff?: StaffFindOneData
}

export class SellingCalcDto implements SellingCalc {
	@ApiProperty({ type: Number })
	totalOtherPayment: Decimal

	@ApiProperty({ type: Number })
	totalCardPayment: Decimal

	@ApiProperty({ type: Number })
	totalCashPayment: Decimal

	@ApiProperty({ type: Number })
	totalTransferPayment: Decimal

	@ApiProperty({ type: Number })
	totalDebt: Decimal

	@ApiProperty({ type: Number })
	totalPayment: Decimal

	@ApiProperty({ type: Number })
	totalPrice: Decimal
}

export class SellingFindManyDataDto extends PaginationResponseDto implements SellingFindManyData {
	@ApiProperty({ type: SellingFindOneDataDto, isArray: true })
	data: SellingFindOneData[]

	@ApiProperty({ type: SellingCalcDto })
	calc: SellingCalc
}

export class SellingFindManyResponseDto extends GlobalResponseDto implements SellingFindManyResponse {
	@ApiProperty({ type: SellingFindManyDataDto })
	data: SellingFindManyData
}

export class SellingFindOneResponseDto extends GlobalResponseDto implements SellingFindOneResponse {
	@ApiProperty({ type: SellingFindOneDataDto })
	data: SellingFindOneData
}

export class SellingCreateOneResponseDto extends GlobalResponseDto implements SellingCreateOneResponse {
	@ApiProperty({ type: SellingFindOneDataDto })
	data: SellingFindOneData
}

export class SellingModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements SellingModifyResponse {}

export class DebtDto implements Debt {
	@ApiProperty({ type: Number })
	ourDebt: Decimal

	@ApiProperty({ type: Number })
	theirDebt: Decimal
}
export class SellingGetTotalStatsDataDto implements SellingGetTotalStatsData {
	@ApiProperty({ type: Number })
	monthly: Decimal

	@ApiProperty({ type: Number })
	daily: Decimal

	@ApiProperty({ type: Number })
	weekly: Decimal

	@ApiProperty({ type: Number })
	yearly: Decimal

	@ApiProperty({ type: DebtDto })
	client: Debt

	@ApiProperty({ type: DebtDto })
	supplier: Debt
}
export class SellingGetTotalStatsResponseDto extends GlobalResponseDto implements SellingGetTotalStatsResponse {
	@ApiProperty({ type: SellingGetTotalStatsDataDto })
	data: SellingGetTotalStatsData
}

export class SellingGetPeriodStatsDataDto implements SellingGetPeriodStatsData {
	@ApiProperty({ type: Number })
	sum: Decimal

	@ApiProperty({ type: String })
	date: string
}

export class SellingGetPeriodStatsResponseDto extends GlobalResponseDto implements SellingGetPeriodStatsResponse {
	@ApiProperty({ type: SellingGetPeriodStatsDataDto, isArray: true })
	data: SellingGetPeriodStatsData[]
}
