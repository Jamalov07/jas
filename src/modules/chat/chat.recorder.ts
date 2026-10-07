import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import { saveChatFile } from './chat-file.helper'
import { ChatGateway } from './chat.gateway'
import { chatMessageSelect, toChatMessageView } from './chat.mapper'
import { ChatMessageView, SaveChatMessageInput } from './chat.types'

@Injectable()
export class ChatRecorder {
	constructor(
		private readonly prisma: PrismaService,
		private readonly gateway: ChatGateway,
	) {}

	async save(input: SaveChatMessageInput): Promise<ChatMessageView> {
		let filePath: string | null = null
		let fileName: string | null = null
		let mimeType: string | null = null
		if (input.file) {
			const stored = await saveChatFile(input.clientId, input.file.fileName, input.file.buffer)
			filePath = stored.filePath
			fileName = stored.fileName
			mimeType = input.file.mimeType
		}

		const row = await this.prisma.chatMessageModel.create({
			data: {
				clientId: input.clientId,
				direction: input.direction,
				kind: input.kind,
				text: input.text ?? null,
				filePath,
				fileName,
				mimeType,
				telegramMessageId: input.telegramMessageId ?? null,
				staffId: input.staffId ?? null,
				sellingId: input.sellingId ?? null,
			},
			select: chatMessageSelect,
		})
		const view = toChatMessageView(row)
		this.gateway.emitMessage(view.clientId, view)
		return view
	}

	async ingestTelegram(input: {
		telegramUserId: string
		telegramMessageId: number
		text?: string | null
		file?: { buffer: Buffer; fileName: string; mimeType: string; kind: 'photo' | 'document' }
	}): Promise<ChatMessageView | null> {
		const user = await this.prisma.botUserModel.findFirst({
			where: { id: input.telegramUserId },
			select: { clientId: true, isActive: true },
		})
		if (!user?.clientId || user.isActive === false) return null
		return this.save({
			clientId: user.clientId,
			direction: 'in',
			kind: input.file?.kind ?? 'text',
			text: input.text ?? null,
			telegramMessageId: input.telegramMessageId,
			file: input.file ?? null,
		})
	}
}
