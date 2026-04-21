import { ApiPropertyOptional } from '@nestjs/swagger'
import { UploadModeEnum, UploadProductTypeEnum } from '../enums'
import { IsEnum, IsOptional } from 'class-validator'

export class UploadQueryDto {
	@ApiPropertyOptional({ enum: UploadModeEnum, default: UploadModeEnum.APPEND })
	@IsOptional()
	@IsEnum(UploadModeEnum)
	mode?: UploadModeEnum = UploadModeEnum.APPEND

	@ApiPropertyOptional({ enum: UploadProductTypeEnum, default: UploadProductTypeEnum.jas })
	@IsOptional()
	@IsEnum(UploadProductTypeEnum)
	type?: UploadProductTypeEnum = UploadProductTypeEnum.jas
}
