import { Decimal } from '@prisma/client/runtime/library'
import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ClientDebtByCurrency,
	ClientDeed,
	ClientDeedInfo,
	ClientFindManyData,
	ClientFindManyResponse,
	ClientFindOneData,
	ClientFindOneResponse,
	ClientModifyResponse,
	ClientCreateOneResponse,
	ClientReportSummary,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ClientRequiredDto } from './fields.dtos'

export class CurrencyBriefDto {
	@ApiProperty({ type: String })
	id: string

	@ApiProperty({ type: String })
	name: string

	@ApiProperty({ type: String })
	symbol: string
}

export class ClientDebtByCurrencyDto implements ClientDebtByCurrency {
	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal

	@ApiProperty({ type: CurrencyBriefDto })
	currency: CurrencyBriefDto
}

export class ClientDeedDto implements ClientDeed {
	@ApiProperty({ type: Date })
	date: Date

	@ApiProperty({ enum: ['debit', 'credit'] })
	type: 'debit' | 'credit'

	@ApiProperty({ enum: ['selling', 'payment', 'returning', 'change'] })
	action: 'selling' | 'payment' | 'returning' | 'change'

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

export class ClientReportPaymentRowDto {
	@ApiProperty({ type: String })
	type: string

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal

	@ApiProperty({ type: CurrencyBriefDto })
	currency: CurrencyBriefDto
}

export class ClientReportSellingOrReturningDto {
	@ApiProperty({ type: Number })
	documentsCount: number

	@ApiProperty({ type: ClientDebtByCurrencyDto, isArray: true })
	productTotalsByCurrency: ClientDebtByCurrencyDto[]

	@ApiProperty({ type: ClientReportPaymentRowDto, isArray: true })
	paymentMethods: ClientReportPaymentRowDto[]

	@ApiProperty({ type: ClientReportPaymentRowDto, isArray: true })
	changeMethods: ClientReportPaymentRowDto[]
}

export class ClientReportSummaryDto implements ClientReportSummary {
	@ApiPropertyOptional({ type: Object, nullable: true })
	period: ClientReportSummary['period']

	@ApiProperty({ type: ClientReportSellingOrReturningDto })
	selling: ClientReportSummary['selling']

	@ApiProperty({ type: ClientReportSellingOrReturningDto })
	returning: ClientReportSummary['returning']
}

export class ClientFindOneDataDto extends PickType(ClientRequiredDto, ['id', 'fullname', 'createdAt', 'phone']) implements ClientFindOneData {
	@ApiProperty({ type: ClientDebtByCurrencyDto, isArray: true })
	debtByCurrency?: ClientDebtByCurrency[]

	@ApiProperty({ type: Date })
	lastSellingDate?: Date

	@ApiProperty({ type: ClientDeedInfoDto })
	deedInfo?: ClientDeedInfo

	@ApiPropertyOptional({ type: ClientReportSummaryDto })
	report?: ClientReportSummary
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
