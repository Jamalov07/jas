import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { ClientOptional, ClientRequired } from '../interfaces'
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator'

export class ClientRequiredDto extends DefaultRequiredFieldsDto implements ClientRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	fullname: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsPhoneNumber('UZ')
	phone: string

	description: string | null
}

export class ClientOptionalDto extends DefaultOptionalFieldsDto implements ClientOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	fullname?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsPhoneNumber('UZ')
	phone?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	description?: string
}
