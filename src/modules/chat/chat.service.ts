import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { createResponse, ERROR_MSG } from '@common'
import { PrismaService } from '../shared/prisma'
import { BotService } from '../bot/bot.service'
import { ChatGateway } from './chat.gateway'
import { ChatRecorder } from './chat.recorder'
import { ChatRepository } from './chat.repository'
import { ChatCreateTextRequestDto, ChatFindManyRequestDto, ChatSendFileRequestDto } from './dtos'

const TELEGRAM_DELETE_MS = 48 * 60 * 60 * 1000

@Injectable()
export class ChatService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly repository: ChatRepository,
		private readonly recorder: ChatRecorder,
		private readonly gateway: ChatGateway,
		@Inject(forwardRef(() => BotService)) private readonly botService: BotService,
	) {}

	async findMany(query: ChatFindManyRequestDto) {
		await this.requireClient(query.clientId)
		const data = await this.repository.findMany(query)
		return createResponse({ data, success: { messages: ['get many success'] } })
	}

	async inbox() {
		const data = await this.repository.inbox()
		return createResponse({ data, success: { messages: ['get many success'] } })
	}

	async createText(staffId: string, body: ChatCreateTextRequestDto) {
		const client = await this.requireClient(body.clientId)
		const telegramMessageId = await this.deliverText(client.telegram, body.text)
		const message = await this.recorder.save({
			clientId: client.id,
			direction: 'out',
			kind: 'text',
			text: body.text,
			staffId,
			telegramMessageId,
		})
		return createResponse({
			data: message,
			success: { messages: ['create one success'] },
			warning: this.deliveryWarning(telegramMessageId),
		})
	}

	async createFile(staffId: string, body: ChatSendFileRequestDto, file?: { buffer: Buffer; originalname?: string; mimetype?: string }) {
		if (!file?.buffer?.length) {
			throw new BadRequestException(ERROR_MSG.CHAT.FILE_REQUIRED.UZ)
		}
		const client = await this.requireClient(body.clientId)
		const fileName = file.originalname || 'file'
		const mimeType = file.mimetype || 'application/octet-stream'
		const kind = mimeType.startsWith('image/') ? 'photo' : 'document'
		const telegramMessageId = await this.deliverFile(client.telegram, file.buffer, fileName, mimeType, body.text)
		const message = await this.recorder.save({
			clientId: client.id,
			direction: 'out',
			kind,
			text: body.text ?? null,
			staffId,
			telegramMessageId,
			file: { buffer: file.buffer, fileName, mimeType },
		})
		return createResponse({
			data: message,
			success: { messages: ['create one success'] },
			warning: this.deliveryWarning(telegramMessageId),
		})
	}

	async deleteOne(id: string) {
		const row = await this.repository.findOne(id)
		if (!row) {
			throw new BadRequestException(ERROR_MSG.CHAT.NOT_FOUND.UZ)
		}
		let telegramDeleted = false
		const age = Date.now() - new Date(row.createdAt).getTime()
		if (row.telegramMessageId && row.client?.telegram?.id && age < TELEGRAM_DELETE_MS) {
			telegramDeleted = await this.botService.deleteTelegramMessage(row.client.telegram.id, row.telegramMessageId)
		}
		await this.repository.softDelete(id)
		this.gateway.emitDeleted(row.clientId, row.id)
		const failedOnTelegram = !!row.telegramMessageId && !telegramDeleted
		return createResponse({
			data: { id: row.id, telegramDeleted },
			success: { messages: ['delete one success'] },
			warning: failedOnTelegram ? { is: true, messages: ['telegramdagi xabar o‘chirilmadi'] } : undefined,
		})
	}

	private async requireClient(clientId: string) {
		const client = await this.prisma.clientModel.findFirst({
			where: { id: clientId },
			select: { id: true, telegram: { select: { id: true, isActive: true } } },
		})
		if (!client) {
			throw new BadRequestException(ERROR_MSG.CLIENT.NOT_FOUND.UZ)
		}
		return client
	}

	private async deliverText(telegram: { id: string; isActive: boolean } | null, text: string) {
		if (!telegram?.id || telegram.isActive === false) return null
		return this.botService.sendTextToClient(telegram.id, text)
	}

	private async deliverFile(telegram: { id: string; isActive: boolean } | null, buffer: Buffer, fileName: string, mimeType: string, caption?: string) {
		if (!telegram?.id || telegram.isActive === false) return null
		return this.botService.sendFileToClient(telegram.id, buffer, fileName, mimeType, caption)
	}

	private deliveryWarning(telegramMessageId: number | null) {
		if (telegramMessageId) return undefined
		return { is: true, messages: ['mijoz telegramiga yuborilmadi'] }
	}
}
