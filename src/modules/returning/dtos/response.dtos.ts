import { ApiProperty, ApiPropertyOptional, IntersectionType, PickType } from '@nestjs/swagger'
import {
	ReturningCreateOneResponse,
	ReturningFindManyData,
	ReturningFindManyResponse,
	ReturningFindOneData,
	ReturningFindOneResponse,
	ReturningModifyResponse,
} from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { ReturningRequiredDto } from './fields.dtos'

export class ReturningFindOneDataDto extends PickType(ReturningRequiredDto, ['id', 'status', 'date', 'createdAt']) implements ReturningFindOneData {
	@ApiPropertyOptional()
	payment?: any

	@ApiPropertyOptional()
	products?: any[]

	@ApiPropertyOptional()
	client?: any

	@ApiPropertyOptional()
	staff?: any
}

export class ReturningFindManyDataDto extends PaginationResponseDto implements ReturningFindManyData {
	@ApiProperty({ type: ReturningFindOneDataDto, isArray: true })
	data: ReturningFindOneData[]
}

export class ReturningFindManyResponseDto extends GlobalResponseDto implements ReturningFindManyResponse {
	@ApiProperty({ type: ReturningFindManyDataDto })
	data: ReturningFindManyData
}

export class ReturningFindOneResponseDto extends GlobalResponseDto implements ReturningFindOneResponse {
	@ApiProperty({ type: ReturningFindOneDataDto })
	data: ReturningFindOneData
}

export class ReturningCreateOneResponseDto extends GlobalResponseDto implements ReturningCreateOneResponse {
	@ApiProperty({ type: ReturningFindOneDataDto })
	data: ReturningFindOneData
}

export class ReturningModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements ReturningModifyResponse {}
