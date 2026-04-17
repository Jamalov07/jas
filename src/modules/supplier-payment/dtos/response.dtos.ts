import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	SupplierPaymentCalcByCurrency,
	SupplierPaymentChangeMethodData,
	SupplierPaymentCreateOneResponse,
	SupplierPaymentFindManyData,
	SupplierPaymentFindManyResponse,
	SupplierPaymentFindOneData,
	SupplierPaymentFindOneResponse,
	SupplierPaymentMethodData,
	SupplierPaymentModifyResponse,
} from '../interfaces'
import { CurrencyBriefDto, GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { SupplierPaymentRequiredDto } from './fields.dtos'
import type { SupplierDebtByCurrency } from '../../supplier/interfaces'
import { Decimal } from '@prisma/client/runtime/library'

export class SupplierPaymentMethodDataDto implements SupplierPaymentMethodData {
	@ApiProperty({ type: String })
	type: string

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal
}

export class SupplierPaymentChangeMethodDataDto implements SupplierPaymentChangeMethodData {
	@ApiProperty({ type: String })
	type: string

	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	amount: Decimal
}

export class SupplierPaymentCalcByCurrencyDto implements SupplierPaymentCalcByCurrency {
	@ApiProperty({ type: String })
	currencyId: string

	@ApiProperty({ type: Number })
	total: Decimal

	@ApiProperty({ type: CurrencyBriefDto })
	currency: CurrencyBriefDto
}

export class SupplierPaymentFindOneDataDto extends PickType(SupplierPaymentRequiredDto, ['id', 'createdAt']) implements SupplierPaymentFindOneData {
	@ApiPropertyOptional()
	staff?: { id: string; fullname: string; phone: string }

	@ApiPropertyOptional()
	supplier?: { id: string; fullname: string; phone: string; debtByCurrency?: SupplierDebtByCurrency[] }

	@ApiPropertyOptional({ type: SupplierPaymentCalcByCurrencyDto, isArray: true })
	totalsByCurrency?: SupplierPaymentCalcByCurrency[]

	@ApiProperty({ type: SupplierPaymentMethodDataDto, isArray: true })
	paymentMethods?: SupplierPaymentMethodData[]

	@ApiPropertyOptional({ type: SupplierPaymentChangeMethodDataDto, isArray: true })
	changeMethods?: SupplierPaymentChangeMethodData[]
}

export class SupplierPaymentFindManyDataDto extends PaginationResponseDto implements SupplierPaymentFindManyData {
	@ApiProperty({ type: SupplierPaymentFindOneDataDto, isArray: true })
	data: SupplierPaymentFindOneData[]

	@ApiProperty({ type: SupplierPaymentCalcByCurrencyDto, isArray: true })
	calcByCurrency: SupplierPaymentCalcByCurrency[]

	@ApiProperty({ type: SupplierPaymentCalcByCurrencyDto, isArray: true })
	totalsByCurrency: SupplierPaymentCalcByCurrency[]
}

export class SupplierPaymentFindManyResponseDto extends GlobalResponseDto implements SupplierPaymentFindManyResponse {
	@ApiProperty({ type: SupplierPaymentFindManyDataDto })
	data: SupplierPaymentFindManyData
}

export class SupplierPaymentFindOneResponseDto extends GlobalResponseDto implements SupplierPaymentFindOneResponse {
	@ApiProperty({ type: SupplierPaymentFindOneDataDto })
	data: SupplierPaymentFindOneData
}

export class SupplierPaymentCreateOneResponseDto extends GlobalResponseDto implements SupplierPaymentCreateOneResponse {
	@ApiProperty({ type: SupplierPaymentFindOneDataDto })
	data: SupplierPaymentFindOneData
}

export class SupplierPaymentModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements SupplierPaymentModifyResponse {}
