import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import {
	SupplierPaymentCalc,
	SupplierPaymentCreateOneResponse,
	SupplierPaymentFindManyData,
	SupplierPaymentFindManyResponse,
	SupplierPaymentFindOneData,
	SupplierPaymentFindOneResponse,
	SupplierPaymentModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { SupplierPaymentRequiredDto } from './fields.dtos'
import { Decimal } from '@prisma/client/runtime/library'

export class SupplierPaymentFindOneDataDto extends PickType(SupplierPaymentRequiredDto, ['id', 'description', 'createdAt']) implements SupplierPaymentFindOneData {}

export class SupplierPaymentCalcDto implements SupplierPaymentCalc {
	@ApiProperty({ type: Number })
	totalCard: Decimal

	@ApiProperty({ type: Number })
	totalCash: Decimal

	@ApiProperty({ type: Number })
	totalOther: Decimal

	@ApiProperty({ type: Number })
	totalTransfer: Decimal
}

export class SupplierPaymentFindManyDataDto extends PaginationResponseDto implements SupplierPaymentFindManyData {
	@ApiProperty({ type: SupplierPaymentFindOneDataDto, isArray: true })
	data: SupplierPaymentFindOneData[]

	@ApiProperty({ type: SupplierPaymentCalcDto })
	calc: SupplierPaymentCalc
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
