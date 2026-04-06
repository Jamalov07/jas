import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto, GlobalModifyResponseDto, GlobalResponseDto } from '../../../common'
import {
	DayCloseCreateOneRequest,
	DayCloseGetOneData,
	DayCloseGetOneRequest,
	DayCloseGetOneResponse,
	DayCloseModifyResponse,
	DayCloseOptional,
	DayCloseRequired,
} from '../interfaces'
import { IsDateString, IsNotEmpty, IsOptional } from 'class-validator'

export class DayCloseRequiredDto extends DefaultRequiredFieldsDto implements DayCloseRequired {
	@ApiProperty({ type: Date, example: new Date() })
	@IsNotEmpty()
	@IsDateString()
	closedDate: Date
}

export class DayCloseOptionalDto extends DefaultOptionalFieldsDto implements DayCloseOptional {
	@ApiPropertyOptional({ type: Date, example: new Date() })
	@IsOptional()
	@IsDateString()
	closedDate?: Date
}

export class DayCloseGetOneDataDto implements DayCloseGetOneData {
	@ApiProperty({ type: Boolean })
	isClosed: boolean
}

export class DayCloseCreateOneRequestDto implements DayCloseCreateOneRequest {}

export class DayCloseGetOneRequestDto implements DayCloseGetOneRequest {}

export class DayCloseGetOneResponseDto extends GlobalResponseDto implements DayCloseGetOneResponse {
	@ApiProperty({ type: DayCloseGetOneDataDto })
	data: DayCloseGetOneData
}

export class DayCloseModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements DayCloseModifyResponse {}
