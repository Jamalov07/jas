import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ClientPaymentCalcByCurrency,
	ClientPaymentCreateOneResponse,
	ClientPaymentFindManyData,
	ClientPaymentFindManyResponse,
	ClientPaymentFindOneData,
	ClientPaymentFindOneResponse,
	ClientPaymentMethodData,
	ClientPaymentModifyResponse,
} from '../interfaces'
import { CurrencyBriefDto, GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ClientPaymentRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'

export class ClientPaymentMethodDataDto implements ClientPaymentMethodData {
	@ApiProperty({ type: String })
	type: string

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal
}

export class ClientPaymentCalcByCurrencyDto implements ClientPaymentCalcByCurrency {
	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal

	@ApiProperty({ type: CurrencyBriefDto })
	currency: CurrencyBriefDto
}

export class ClientPaymentFindOneDataDto extends PickType(ClientPaymentRequiredDto, ['id', 'createdAt']) implements ClientPaymentFindOneData {
	@ApiProperty({ type: ClientPaymentMethodDataDto, isArray: true })
	paymentMethods?: ClientPaymentMethodData[]
}

export class ClientPaymentFindManyDataDto extends PaginationResponseDto implements ClientPaymentFindManyData {
	@ApiProperty({ type: ClientPaymentFindOneDataDto, isArray: true })
	data: ClientPaymentFindOneData[]

	@ApiProperty({ type: ClientPaymentCalcByCurrencyDto, isArray: true })
	calcByCurrency: ClientPaymentCalcByCurrency[]
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
