import { $Enums, ActionMethodEnum } from '@prisma/client'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { ActionOptional, ActionRequired } from '../interfaces'
import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class ActionRequiredDto extends PickType(DefaultRequiredFieldsDto, ['id']) implements ActionRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	name: string

	@ApiProperty({ enum: ActionMethodEnum })
	@IsNotEmpty()
	@IsEnum(ActionMethodEnum)
	method: $Enums.ActionMethodEnum

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	url: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	description: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	permissionId: string
}

export class ActionOptionalDto extends PickType(DefaultOptionalFieldsDto, ['id']) implements ActionOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	name?: string = ''

	@ApiPropertyOptional({ enum: ActionMethodEnum })
	@IsOptional()
	@IsEnum(ActionMethodEnum)
	method?: $Enums.ActionMethodEnum = undefined

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	url?: string = ''

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	description?: string = ''

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	permissionId?: string
}
