import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { SupplierOptional, SupplierRequired } from '../interfaces'
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString } from 'class-validator'

export class SupplierRequiredDto extends DefaultRequiredFieldsDto implements SupplierRequired {
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

export class SupplierOptionalDto extends DefaultOptionalFieldsDto implements SupplierOptional {
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
