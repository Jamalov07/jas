import { ApiProperty, ApiPropertyOptional, IntersectionType } from '@nestjs/swagger'
import { ChatMessageDirectionEnum, ChatMessageKindEnum } from '@prisma/client'
import { Type } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { GlobalResponseDto, PaginationRequestDto, PaginationResponseDto } from '@common'

export class ChatFindManyRequestDto extends IntersectionType(PaginationRequestDto) {
	@ApiProperty({ type: String })
	@IsUUID('4')
	@IsNotEmpty()
	clientId: string
}

export class ChatCreateTextRequestDto {
	@ApiProperty({ type: String })
	@IsUUID('4')
	@IsNotEmpty()
	clientId: string

	@ApiProperty({ type: String })
	@IsString()
	@IsNotEmpty()
	@MaxLength(4096)
	text: string
}

export class ChatSendFileRequestDto {
	@ApiProperty({ type: String })
	@IsUUID('4')
	@IsNotEmpty()
	clientId: string

	@ApiPropertyOptional({ type: String })
	@IsOptional()
	@IsString()
	@MaxLength(4096)
	text?: string
}

export class ChatDeleteOneRequestDto {
	@ApiProperty({ type: String })
	@IsUUID('4')
	@IsNotEmpty()
	id: string
}

export class ChatMessageStaffDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	fullname: string
}

export class ChatMessageDataDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	clientId: string

	@ApiProperty({ enum: ChatMessageDirectionEnum })
	@IsEnum(ChatMessageDirectionEnum)
	direction: ChatMessageDirectionEnum

	@ApiProperty({ enum: ChatMessageKindEnum })
	@IsEnum(ChatMessageKindEnum)
	kind: ChatMessageKindEnum

	@ApiProperty({ nullable: true })
	text: string | null

	@ApiProperty({ nullable: true })
	fileName: string | null

	@ApiProperty({ nullable: true })
	mimeType: string | null

	@ApiProperty({ nullable: true })
	fileUrl: string | null

	@ApiProperty({ nullable: true })
	telegramMessageId: number | null

	@ApiProperty({ nullable: true })
	staffId: string | null

	@ApiProperty({ nullable: true, type: ChatMessageStaffDto })
	@Type(() => ChatMessageStaffDto)
	staff: ChatMessageStaffDto | null

	@ApiProperty({ nullable: true })
	sellingId: string | null

	@ApiProperty()
	createdAt: Date
}

export class ChatFindManyDataDto extends PaginationResponseDto {
	@ApiProperty({ type: ChatMessageDataDto, isArray: true })
	data: ChatMessageDataDto[]
}

export class ChatFindManyResponseDto extends GlobalResponseDto {
	@ApiProperty({ type: ChatFindManyDataDto })
	data: ChatFindManyDataDto
}

export class ChatCreateResponseDto extends GlobalResponseDto {
	@ApiProperty({ type: ChatMessageDataDto })
	data: ChatMessageDataDto
}

export class ChatDeleteDataDto {
	@ApiProperty()
	id: string

	@ApiProperty()
	telegramDeleted: boolean
}

export class ChatDeleteResponseDto extends GlobalResponseDto {
	@ApiProperty({ type: ChatDeleteDataDto })
	data: ChatDeleteDataDto
}
