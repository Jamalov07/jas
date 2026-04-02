import { ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFields } from '../../interfaces'
import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator'

export class DefaultOptionalFieldsDto implements DefaultOptionalFields {
	@ApiPropertyOptional({ type: String, example: '00097072-f510-4ded-a18f-976d7fa2e024' })
	@IsOptional()
	@IsString()
	@IsUUID('4')
	id?: string

	@ApiPropertyOptional({ type: Date, example: new Date() })
	@IsOptional()
	@IsDateString()
	createdAt?: Date

	@ApiPropertyOptional({ type: Date, example: new Date() })
	@IsOptional()
	@IsDateString()
	updatedAt?: Date

	@ApiPropertyOptional({ type: Date, example: new Date() })
	@IsOptional()
	@IsDateString()
	deletedAt?: Date
}
