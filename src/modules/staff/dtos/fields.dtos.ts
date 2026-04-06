import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { StaffOptional, StaffRequired } from '../interfaces'
import { IsEnum, IsJWT, IsNotEmpty, IsOptional, IsPhoneNumber, IsString, IsUUID } from 'class-validator'
import { $Enums, PageEnum, StaffTypeEnum } from '@prisma/client'

export class StaffRequiredDto extends DefaultRequiredFieldsDto implements StaffRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	fullname: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	password: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsPhoneNumber('UZ')
	phone: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsJWT()
	token: string

	@ApiProperty({ enum: StaffTypeEnum })
	@IsNotEmpty()
	@IsEnum(StaffTypeEnum)
	type: $Enums.StaffTypeEnum

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string

	@ApiProperty({ enum: PageEnum, isArray: true })
	pages: $Enums.PageEnum[]
}

export class StaffOptionalDto extends DefaultOptionalFieldsDto implements StaffOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	fullname?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	password?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsPhoneNumber('UZ')
	phone?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsJWT()
	token?: string

	@ApiPropertyOptional({ enum: StaffTypeEnum })
	@IsOptional()
	@IsEnum(StaffTypeEnum)
	type?: $Enums.StaffTypeEnum

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	currencyId?: string

	@ApiPropertyOptional({ enum: PageEnum, isArray: true })
	pages?: $Enums.PageEnum[]
}
