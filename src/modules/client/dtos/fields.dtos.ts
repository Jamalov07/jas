import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { ClientOptional, ClientRequired } from '../interfaces'
import { IsEnum, IsJWT, IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator'
import { $Enums, UserTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export class ClientRequiredDto extends DefaultRequiredFieldsDto implements ClientRequired {
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

	@ApiProperty({ enum: UserTypeEnum })
	@IsNotEmpty()
	@IsEnum(UserTypeEnum)
	type: $Enums.UserTypeEnum

	@ApiProperty({ type: Decimal })
	balance: Decimal
}

export class ClientOptionalDto extends DefaultOptionalFieldsDto implements ClientOptional {
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

	@ApiPropertyOptional({ enum: UserTypeEnum })
	@IsOptional()
	@IsEnum(UserTypeEnum)
	type?: $Enums.UserTypeEnum

	@ApiPropertyOptional({ type: Decimal })
	balance?: Decimal
}
