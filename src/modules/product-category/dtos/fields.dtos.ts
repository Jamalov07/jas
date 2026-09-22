import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { ProductCategoryOptional, ProductCategoryRequired } from '../interfaces'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class ProductCategoryRequiredDto extends DefaultRequiredFieldsDto implements ProductCategoryRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsString()
	name: string
}

export class ProductCategoryOptionalDto extends DefaultOptionalFieldsDto implements ProductCategoryOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	name?: string
}
