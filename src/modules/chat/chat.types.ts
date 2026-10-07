import { ChatMessageDirectionEnum, ChatMessageKindEnum } from '@prisma/client'

export type ChatMessageView = {
	id: string
	clientId: string
	direction: ChatMessageDirectionEnum
	kind: ChatMessageKindEnum
	text: string | null
	fileName: string | null
	mimeType: string | null
	fileUrl: string | null
	telegramMessageId: number | null
	staffId: string | null
	staff: { id: string; fullname: string } | null
	sellingId: string | null
	createdAt: Date
}

export type ChatFileInput = {
	buffer: Buffer
	fileName: string
	mimeType: string
}

export type SaveChatMessageInput = {
	clientId: string
	direction: ChatMessageDirectionEnum
	kind: ChatMessageKindEnum
	text?: string | null
	telegramMessageId?: number | null
	staffId?: string | null
	sellingId?: string | null
	file?: ChatFileInput | null
}
