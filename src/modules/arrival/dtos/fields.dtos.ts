import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { ArrivalOptional, ArrivalRequired } from '../interfaces'
import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator'

export class ArrivalRequiredDto extends DefaultRequiredFieldsDto implements ArrivalRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	supplierId: string

	@ApiProperty({ type: Date })
	@IsNotEmpty()
	@IsDateString()
	date: Date

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	staffId: string
}

export class ArrivalOptionalDto extends DefaultOptionalFieldsDto implements ArrivalOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	supplierId?: string

	@ApiPropertyOptional({ type: Date })
	@IsOptional()
	@IsDateString()
	date?: Date

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string
}
