import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ReturningCreateOneResponse,
	ReturningFindManyData,
	ReturningFindManyResponse,
	ReturningFindOneData,
	ReturningFindOneResponse,
	ReturningModifyResponse,
	ReturningTotalData,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ReturningRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'

export class ReturningTotalDataDto implements ReturningTotalData {
	@ApiProperty({ type: String })
	id: string

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty()
	currency: { id: string; symbol: string; name: string }

	@ApiProperty({ type: Number })
	total: Decimal
}

export class ReturningFindOneDataDto extends PickType(ReturningRequiredDto, ['id', 'status', 'date', 'createdAt']) implements ReturningFindOneData {
	@ApiProperty({ type: ReturningTotalDataDto, isArray: true })
	totals?: ReturningTotalData[]
}

export class ReturningFindManyDataDto extends PaginationResponseDto implements ReturningFindManyData {
	@ApiProperty({ type: ReturningFindOneDataDto, isArray: true })
	data: ReturningFindOneData[]
}

export class ReturningFindManyResponseDto extends GlobalResponseDto implements ReturningFindManyResponse {
	@ApiProperty({ type: ReturningFindManyDataDto })
	data: ReturningFindManyData
}

export class ReturningFindOneResponseDto extends GlobalResponseDto implements ReturningFindOneResponse {
	@ApiProperty({ type: ReturningFindOneDataDto })
	data: ReturningFindOneData
}

export class ReturningCreateOneResponseDto extends GlobalResponseDto implements ReturningCreateOneResponse {
	@ApiProperty({ type: ReturningFindOneDataDto })
	data: ReturningFindOneData
}

export class ReturningModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ReturningModifyResponse {}
