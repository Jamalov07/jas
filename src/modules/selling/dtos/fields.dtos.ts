import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { SellingOptional, SellingRequired } from '../interfaces'
import { IsBoolean, IsDateString, IsEnum, IsJWT, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUUID } from 'class-validator'
import { $Enums, SellingStatusEnum, UserTypeEnum } from '@prisma/client'

export class SellingRequiredDto extends DefaultRequiredFieldsDto implements SellingRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	clientId: string

	@ApiProperty({ type: Date })
	@IsNotEmpty()
	@IsDateString()
	date: Date

	@ApiProperty({ type: Boolean })
	@IsNotEmpty()
	@IsBoolean()
	send: boolean

	@ApiProperty({ type: Boolean })
	@IsNotEmpty()
	@IsBoolean()
	sended: boolean

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
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	clientId?: string

	@ApiPropertyOptional({ type: Date })
	@IsOptional()
	@IsDateString()
	date?: Date

	@ApiPropertyOptional({ type: Boolean })
	@IsOptional()
	@IsBoolean()
	send?: boolean

	@ApiPropertyOptional({ type: Boolean })
	@IsOptional()
	@IsBoolean()
	sended?: boolean

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string

	@ApiPropertyOptional({ enum: SellingStatusEnum })
	@IsOptional()
	@IsEnum(SellingStatusEnum)
	status?: $Enums.SellingStatusEnum
}
