import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ClientPaymentCalc,
	ClientPaymentCreateOneResponse,
	ClientPaymentFindManyData,
	ClientPaymentFindManyResponse,
	ClientPaymentFindOneData,
	ClientPaymentFindOneResponse,
	ClientPaymentModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ClientPaymentRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'

export class ClientPaymentFindOneDataDto extends PickType(ClientPaymentRequiredDto, ['id', 'description', 'createdAt']) implements ClientPaymentFindOneData {}

export class ClientPaymentCalcDto implements ClientPaymentCalc {
	@ApiProperty({ type: Number })
	totalCard: Decimal

	@ApiProperty({ type: Number })
	totalCash: Decimal

	@ApiProperty({ type: Number })
	totalOther: Decimal

	@ApiProperty({ type: Number })
	totalTransfer: Decimal
}

export class ClientPaymentFindManyDataDto extends PaginationResponseDto implements ClientPaymentFindManyData {
	@ApiProperty({ type: ClientPaymentFindOneDataDto, isArray: true })
	data: ClientPaymentFindOneData[]

	@ApiProperty({ type: ClientPaymentCalcDto })
	calc: ClientPaymentCalc
}

export class ClientPaymentFindManyResponseDto extends GlobalResponseDto implements ClientPaymentFindManyResponse {
	@ApiProperty({ type: ClientPaymentFindManyDataDto })
	data: ClientPaymentFindManyData
}

export class ClientPaymentFindOneResponseDto extends GlobalResponseDto implements ClientPaymentFindOneResponse {
	@ApiProperty({ type: ClientPaymentFindOneDataDto })
	data: ClientPaymentFindOneData
}

export class ClientPaymentCreateOneResponseDto extends GlobalResponseDto implements ClientPaymentCreateOneResponse {
	@ApiProperty({ type: ClientPaymentFindOneDataDto })
	data: ClientPaymentFindOneData
}

export class ClientPaymentModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ClientPaymentModifyResponse {}
