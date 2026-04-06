import { Decimal } from '@prisma/client/runtime/library'
import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	SupplierCreateOneResponse,
	SupplierDebtByCurrency,
	SupplierDeed,
	SupplierDeedInfo,
	SupplierFindManyData,
	SupplierFindManyResponse,
	SupplierFindOneData,
	SupplierFindOneResponse,
	SupplierModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { SupplierRequiredDto } from './fields.dtos'

export class SupplierDebtByCurrencyDto implements SupplierDebtByCurrency {
	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal
}

export class SupplierDeedDto implements SupplierDeed {
	@ApiProperty({ type: Date })
	date: Date

	@ApiProperty({ enum: ['debit', 'credit'] })
	type: 'debit' | 'credit'

	@ApiProperty({ type: Number })
	value: Decimal

	@ApiProperty({ type: String })
	description: string

	@ApiProperty({ enum: ['payment', 'arrival'] })
	action?: 'payment' | 'arrival'

	@ApiProperty({ type: String })
	currencyId?: string
}

export class SupplierDeedInfoDto implements SupplierDeedInfo {
	@ApiProperty({ type: SupplierDeedDto, isArray: true })
	deeds: SupplierDeed[]

	@ApiProperty({ type: SupplierDebtByCurrencyDto, isArray: true })
	debtByCurrency: SupplierDebtByCurrency[]

	@ApiProperty({ type: SupplierDebtByCurrencyDto, isArray: true })
	totalCreditByCurrency: SupplierDebtByCurrency[]

	@ApiProperty({ type: SupplierDebtByCurrencyDto, isArray: true })
	totalDebitByCurrency: SupplierDebtByCurrency[]
}

export class SupplierFindOneDataDto extends PickType(SupplierRequiredDto, ['id', 'fullname', 'createdAt', 'phone']) implements SupplierFindOneData {
	@ApiProperty({ type: SupplierDebtByCurrencyDto, isArray: true })
	debtByCurrency?: SupplierDebtByCurrency[]

	@ApiProperty({ type: Date })
	lastArrivalDate?: Date

	@ApiProperty({ type: SupplierDeedInfoDto })
	deedInfo?: SupplierDeedInfo
}

export class SupplierFindManyDataDto extends PaginationResponseDto implements SupplierFindManyData {
	@ApiProperty({ type: SupplierFindOneDataDto, isArray: true })
	data: SupplierFindOneData[]
}

export class SupplierFindManyResponseDto extends GlobalResponseDto implements SupplierFindManyResponse {
	@ApiProperty({ type: SupplierFindManyDataDto })
	data: SupplierFindManyData
}

export class SupplierFindOneResponseDto extends GlobalResponseDto implements SupplierFindOneResponse {
	@ApiProperty({ type: SupplierFindOneDataDto })
	data: SupplierFindOneData
}

export class SupplierCreateOneResponseDto extends GlobalResponseDto implements SupplierCreateOneResponse {
	@ApiProperty({ type: SupplierFindOneDataDto })
	data: SupplierFindOneData
}

export class SupplierModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements SupplierModifyResponse {}
