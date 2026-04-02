import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { ProductOptional, ProductRequired } from '../interfaces'
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'

export class ProductRequiredDto extends DefaultRequiredFieldsDto implements ProductRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	name: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsNumber()
	count: number

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsNumber()
	minAmount: number

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	description: string
}

export class ProductOptionalDto extends DefaultOptionalFieldsDto implements ProductOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	name?: string

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsNumber()
	count?: number

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsNumber()
	minAmount?: number

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	description?: string
}
