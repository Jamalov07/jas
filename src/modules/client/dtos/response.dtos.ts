import { Decimal } from '@prisma/client/runtime/library'
import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ClientCalc,
	ClientDebtByCurrency,
	ClientDeed,
	ClientDeedInfo,
	ClientFindManyData,
	ClientFindManyResponse,
	ClientFindOneData,
	ClientFindOneResponse,
	ClientModifyResponse,
	ClientCreateOneResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ClientRequiredDto } from './fields.dtos'

export class ClientDebtByCurrencyDto implements ClientDebtByCurrency {
	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal
}

export class ClientDeedDto implements ClientDeed {
	@ApiProperty({ type: Date })
	date: Date

	@ApiProperty({ enum: ['debit', 'credit'] })
	type: 'debit' | 'credit'

	@ApiProperty({ enum: ['selling', 'payment', 'returning'] })
	action: 'selling' | 'payment' | 'returning'

	@ApiProperty({ type: Number })
	value: Decimal

	@ApiProperty({ type: String })
	description: string

	@ApiProperty({ type: String })
	currencyId?: string
}

export class ClientDeedInfoDto implements ClientDeedInfo {
	@ApiProperty({ type: ClientDeedDto, isArray: true })
	deeds: ClientDeed[]

	@ApiProperty({ type: ClientDebtByCurrencyDto, isArray: true })
	debtByCurrency: ClientDebtByCurrency[]

	@ApiProperty({ type: ClientDebtByCurrencyDto, isArray: true })
	totalCreditByCurrency: ClientDebtByCurrency[]

	@ApiProperty({ type: ClientDebtByCurrencyDto, isArray: true })
	totalDebitByCurrency: ClientDebtByCurrency[]
}

export class ClientFindOneDataDto extends PickType(ClientRequiredDto, ['id', 'fullname', 'createdAt', 'phone']) implements ClientFindOneData {
	@ApiProperty({ type: ClientDebtByCurrencyDto, isArray: true })
	debtByCurrency?: ClientDebtByCurrency[]

	@ApiProperty({ type: Date })
	lastSellingDate?: Date

	@ApiProperty({ type: ClientDeedInfoDto })
	deedInfo?: ClientDeedInfo
}

export class ClientFindManyDataDto extends PaginationResponseDto implements ClientFindManyData {
	@ApiProperty({ type: ClientFindOneDataDto, isArray: true })
	data: ClientFindOneData[]
}

export class ClientFindManyResponseDto extends GlobalResponseDto implements ClientFindManyResponse {
	@ApiProperty({ type: ClientFindManyDataDto })
	data: ClientFindManyData
}

export class ClientFindOneResponseDto extends GlobalResponseDto implements ClientFindOneResponse {
	@ApiProperty({ type: ClientFindOneDataDto })
	data: ClientFindOneData
}

export class ClientCreateOneResponseDto extends GlobalResponseDto implements ClientCreateOneResponse {
	@ApiProperty({ type: ClientFindOneDataDto })
	data: ClientFindOneData
}

export class ClientModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ClientModifyResponse {}
