import { ProductMVOptional, ProductMVRequired } from '../interfaces'
import { $Enums, ServiceTypeEnum } from '@prisma/client'
import { DefaultOptionalFieldsDto, DefaultRequiredFieldsDto } from '../../../common'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator'

export class ProductMVRequiredDto extends DefaultRequiredFieldsDto implements ProductMVRequired {
	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	arrivalId: string

	@ApiProperty({ type: Number })
	@IsNotEmpty()
	@IsNumber()
	count: number

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	productId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	returningId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	sellingId: string

	@ApiProperty({ type: String })
	@IsNotEmpty()
	@IsUUID('4')
	staffId: string

	@ApiProperty({ enum: ServiceTypeEnum })
	@IsNotEmpty()
	@IsEnum(ServiceTypeEnum)
	type: $Enums.ServiceTypeEnum
}

export class ProductMVOptionalDto extends DefaultOptionalFieldsDto implements ProductMVOptional {
	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	arrivalId?: string

	@ApiPropertyOptional({ type: Number })
	@IsOptional()
	@IsNumber()
	count?: number

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	productId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	returningId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	sellingId?: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsUUID('4')
	staffId?: string

	@ApiPropertyOptional({ enum: ServiceTypeEnum })
	@IsOptional()
	@IsEnum(ServiceTypeEnum)
	type?: $Enums.ServiceTypeEnum
}
