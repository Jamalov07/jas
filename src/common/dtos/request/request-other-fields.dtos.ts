import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { RequestOtherFields } from '../../interfaces'
import { ArrayUnique, IsArray, IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator'
import { Transform } from 'class-transformer'
import { DebtTypeEnum, DeleteMethodEnum } from '../../enums'
import { PageEnum } from '@prisma/client'

export class RequestOtherFieldsDto implements RequestOtherFields {
	@ApiPropertyOptional({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	@ArrayUnique({ message: 'UUIDs should be unique' })
	ids: string[] = []

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	search?: string = ''

	@ApiPropertyOptional({ type: Boolean })
	@Transform(({ value }) => ([false, 'false'].includes(value) ? false : [true, 'true'].includes(value) ? true : undefined))
	@IsBoolean()
	@IsOptional()
	isDeleted?: boolean

	@ApiPropertyOptional({ enum: DeleteMethodEnum })
	@IsEnum(DeleteMethodEnum)
	@IsOptional()
	method?: DeleteMethodEnum = DeleteMethodEnum.soft

	@ApiProperty({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	@ArrayUnique({ message: 'UUIDs should be unique' })
	rolesToConnect?: string[] = []

	@ApiProperty({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	@ArrayUnique({ message: 'UUIDs should be unique' })
	rolesToDisconnect?: string[] = []

	@ApiProperty({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	@ArrayUnique({ message: 'UUIDs should be unique' })
	actionsToConnect?: string[] = []

	@ApiProperty({ type: String, isArray: true })
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	@ArrayUnique({ message: 'UUIDs should be unique' })
	actionsToDisconnect?: string[] = []

	@ApiPropertyOptional({ enum: PageEnum, isArray: true })
	@IsOptional()
	@IsEnum(PageEnum, { each: true })
	pagesToConnect?: PageEnum[]

	@ApiPropertyOptional({ enum: PageEnum, isArray: true })
	@IsOptional()
	@IsArray()
	@IsEnum(PageEnum, { each: true })
	pagesToDisconnect?: PageEnum[]

	@ApiPropertyOptional({ description: 'Start date in ISO format (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	@Transform(({ value }) => (value ? new Date(new Date(value).setHours(0, 0, 0, 0)).toISOString() : undefined))
	startDate?: Date

	@ApiPropertyOptional({ description: 'End date in ISO format (YYYY-MM-DD)' })
	@IsOptional()
	@IsDateString()
	@Transform(({ value }) => (value ? new Date(new Date(value).setHours(23, 59, 59, 999)).toISOString() : undefined))
	endDate?: Date

	@ApiPropertyOptional({ enum: DebtTypeEnum })
	@IsEnum(DebtTypeEnum)
	@IsOptional()
	debtType?: DebtTypeEnum

	@ApiPropertyOptional({ type: Number })
	@Transform(({ value }) => (value !== undefined ? Number(value) : 0))
	@IsOptional()
	@IsNumber()
	debtValue?: number
}
