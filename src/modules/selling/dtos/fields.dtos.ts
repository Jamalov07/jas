import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { SellingOptional, SellingRequired } from '../interfaces'
import { IsBoolean, IsDateString, IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID } from 'class-validator'
import { $Enums, SellingStatusEnum } from '@prisma/client'

export class SellingRequiredDto extends DefaultRequiredFieldsDto implements SellingRequired {
	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsInt()
	publicId: number

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	clientId: string

	@ApiProperty({ type: Date })
	@IsNotEmpty()
	@IsDateString()
	date: Date

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	staffId: string

	@ApiProperty({ enum: SellingStatusEnum })
	@IsNotEmpty()
	@IsEnum(SellingStatusEnum)
	status: $Enums.SellingStatusEnum
}

export class SellingOptionalDto extends DefaultOptionalFieldsDto implements SellingOptional {
	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsInt()
	publicId?: number

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	clientId?: string

	@ApiPropertyOptional({ type: Date })
	@IsOptional()
	@IsDateString()
	date?: Date

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string

	@ApiPropertyOptional({ enum: SellingStatusEnum })
	@IsOptional()
	@IsEnum(SellingStatusEnum)
	status?: $Enums.SellingStatusEnum
}
