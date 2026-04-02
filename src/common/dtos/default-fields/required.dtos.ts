import { ApiProperty } from '@nestjs/swagger'
import { DefaultRequiredFields } from '../../interfaces'
import { IsDateString, IsNotEmpty, IsString, IsUUID } from 'class-validator'

export class DefaultRequiredFieldsDto implements DefaultRequiredFields {
	@ApiProperty({ type: String, example: '00097072-f510-4ded-a18f-976d7fa2e024' })
	@IsNotEmpty()
	@IsString()
	@IsUUID('4')
	id: string

	@ApiProperty({ type: Date, example: new Date() })
	@IsNotEmpty()
	@IsDateString()
	createdAt: Date

	@ApiProperty({ type: Date, example: new Date() })
	@IsNotEmpty()
	@IsDateString()
	updatedAt: Date

	@ApiProperty({ type: Date, example: new Date() })
	@IsNotEmpty()
	@IsDateString()
	deletedAt: Date
}
