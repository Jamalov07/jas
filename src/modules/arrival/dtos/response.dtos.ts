import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import { ArrivalCreateOneResponse, ArrivalFindManyData, ArrivalFindManyResponse, ArrivalFindOneData, ArrivalFindOneResponse, ArrivalModifyResponse } from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ArrivalRequiredDto } from './fields.dtos'

export class ArrivalFindOneDataDto extends PickType(ArrivalRequiredDto, ['id', 'date', 'createdAt']) implements ArrivalFindOneData {}

export class ArrivalFindManyDataDto extends PaginationResponseDto implements ArrivalFindManyData {
	@ApiProperty({ type: ArrivalFindOneDataDto, isArray: true })
	data: ArrivalFindOneData[]
}

export class ArrivalFindManyResponseDto extends GlobalResponseDto implements ArrivalFindManyResponse {
	@ApiProperty({ type: ArrivalFindManyDataDto })
	data: ArrivalFindManyData
}

export class ArrivalFindOneResponseDto extends GlobalResponseDto implements ArrivalFindOneResponse {
	@ApiProperty({ type: ArrivalFindOneDataDto })
	data: ArrivalFindOneData
}

export class ArrivalCreateOneResponseDto extends GlobalResponseDto implements ArrivalCreateOneResponse {
	@ApiProperty({ type: ArrivalFindOneDataDto })
	data: ArrivalFindOneData
}

export class ArrivalModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ArrivalModifyResponse {}
