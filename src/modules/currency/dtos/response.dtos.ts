import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import { CurrencyFindManyData, CurrencyFindManyResponse, CurrencyFindOneData, CurrencyFindOneResponse, CurrencyModifyResponse } from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { CurrencyRequiredDto } from './fields.dtos'

export class CurrencyFindOneDataDto extends PickType(CurrencyRequiredDto, ['id', 'name', 'symbol', 'isActive', 'exchangeRate', 'createdAt']) implements CurrencyFindOneData {}

export class CurrencyFindManyDataDto extends PaginationResponseDto implements CurrencyFindManyData {
	@ApiProperty({ type: CurrencyFindOneDataDto, isArray: true })
	data: CurrencyFindOneData[]
}

export class CurrencyFindManyResponseDto extends GlobalResponseDto implements CurrencyFindManyResponse {
	@ApiProperty({ type: CurrencyFindManyDataDto })
	data: CurrencyFindManyData
}

export class CurrencyFindOneResponseDto extends GlobalResponseDto implements CurrencyFindOneResponse {
	@ApiProperty({ type: CurrencyFindOneDataDto })
	data: CurrencyFindOneData
}

export class CurrencyModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements CurrencyModifyResponse {}
