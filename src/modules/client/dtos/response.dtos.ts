import { Decimal } from '@prisma/client/runtime/library'
import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ClientCreateOneResponse,
	ClientDeed,
	ClientDeedInfo,
	ClientFindManyData,
	ClientFindManyResponse,
	ClientFindOneData,
	ClientFindOneResponse,
	ClientModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ClientRequiredDto } from './fields.dtos'

export class ClientDeedDto implements ClientDeed {
	@ApiProperty({ type: Date })
	date: Date

	@ApiProperty({ enum: ['debit', 'kredit'] })
	type: 'debit' | 'credit'

	@ApiProperty({ type: Decimal })
	value: Decimal

	@ApiProperty({ type: String })
	description: string
}

export class ClientDeedInfoDto implements ClientDeedInfo {
	@ApiProperty({ type: ClientDeedDto, isArray: true })
	deeds: ClientDeed[]

	@ApiProperty({ type: Decimal })
	debt: Decimal

	@ApiProperty({ type: Decimal })
	totalCredit: Decimal

	@ApiProperty({ type: Decimal })
	totalDebit: Decimal
}

export class ClientFindOneDataDto extends PickType(ClientRequiredDto, ['id', 'fullname', 'createdAt', 'phone']) implements ClientFindOneData {
	@ApiProperty({ type: Number })
	debt?: Decimal

	@ApiProperty({ type: Date })
	lastArrivalDate?: Date

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
