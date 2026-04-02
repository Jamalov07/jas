import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { PermissionOptional, PermissionRequired } from '../interfaces'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class PermissionRequiredDto extends DefaultRequiredFieldsDto implements PermissionRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	name: string
}

export class PermissionOptionalDto extends DefaultOptionalFieldsDto implements PermissionOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	name?: string
}
