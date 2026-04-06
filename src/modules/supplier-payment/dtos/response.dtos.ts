import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	SupplierPaymentCalcByCurrency,
	SupplierPaymentCreateOneResponse,
	SupplierPaymentFindManyData,
	SupplierPaymentFindManyResponse,
	SupplierPaymentFindOneData,
	SupplierPaymentFindOneResponse,
	SupplierPaymentMethodData,
	SupplierPaymentModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { SupplierPaymentRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'

export class SupplierPaymentMethodDataDto implements SupplierPaymentMethodData {
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
}

export class SupplierPaymentFindOneDataDto extends PickType(SupplierPaymentRequiredDto, ['id', 'createdAt']) implements SupplierPaymentFindOneData {
	@ApiProperty({ type: SupplierPaymentMethodDataDto, isArray: true })
	paymentMethods?: SupplierPaymentMethodData[]
}

export class SupplierPaymentFindManyDataDto extends PaginationResponseDto implements SupplierPaymentFindManyData {
	@ApiProperty({ type: SupplierPaymentFindOneDataDto, isArray: true })
	data: SupplierPaymentFindOneData[]

	@ApiProperty({ type: SupplierPaymentCalcByCurrencyDto, isArray: true })
	calcByCurrency: SupplierPaymentCalcByCurrency[]
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
