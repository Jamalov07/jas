import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger'
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationRequestDto, PaginationResponseDto } from '@common'

export class ReminderClientDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	fullname: string

	@ApiProperty({ nullable: true })
	phone: string | null
}

export class ReminderDataDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	clientId: string

	@ApiProperty({ type: ReminderClientDto })
	client: ReminderClientDto

	@ApiProperty()
	startDate: Date

	@ApiProperty()
	description: string

	@ApiProperty({ nullable: true })
	lastSentOn: Date | null

	@ApiProperty()
	createdAt: Date

	@ApiProperty()
	updatedAt: Date
}

export class ReminderFindManyRequestDto extends IntersectionType(PaginationRequestDto) {
	@ApiPropertyOptional()
	@IsOptional()
	@IsUUID('4')
	clientId?: string
}

export class ReminderFindOneRequestDto {
	@ApiProperty()
	@IsUUID('4')
	@IsNotEmpty()
	id: string
}

export class ReminderCreateOneRequestDto {
	@ApiProperty()
	@IsUUID('4')
	@IsNotEmpty()
	clientId: string

	@ApiProperty({ example: '2026-10-07' })
	@IsDateString()
	@IsNotEmpty()
	startDate: string

	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@MaxLength(1000)
	description: string
}

export class ReminderUpdateOneRequestDto {
	@ApiPropertyOptional({ example: '2026-10-08' })
	@IsOptional()
	@IsDateString()
	startDate?: string

	@ApiPropertyOptional()
	@IsOptional()
	@IsString()
	@MaxLength(1000)
	description?: string
}

export class ReminderFindManyDataDto extends PaginationResponseDto {
	@ApiProperty({ type: ReminderDataDto, isArray: true })
	data: ReminderDataDto[]
}

export class ReminderFindManyResponseDto extends GlobalResponseDto {
	@ApiProperty({ type: ReminderFindManyDataDto })
	data: ReminderFindManyDataDto
}

export class ReminderFindOneResponseDto extends GlobalResponseDto {
	@ApiProperty({ type: ReminderDataDto })
	data: ReminderDataDto
}

export class ReminderModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) {}
