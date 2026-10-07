import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import moment from 'moment-timezone'
import { createResponse, ERROR_MSG } from '@common'
import { PrismaService } from '../shared/prisma'
import { BotService } from '../bot/bot.service'
import { ChatRecorder } from '../chat/chat.recorder'
import { ReminderCreateOneRequestDto, ReminderFindManyRequestDto, ReminderUpdateOneRequestDto } from './dtos'
import { ReminderRepository } from './reminder.repository'

const TZ = 'Asia/Tashkent'
const TELEGRAM_LIMIT = 4000

export type ReminderDispatchResult = {
	processed: number
	sentToClients: number
	skippedNoTelegram: number
	waitingForBot: number
	channelDelivered: boolean
	digest: string
}

@Injectable()
export class ReminderService {
	private readonly logger = new Logger(ReminderService.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly repository: ReminderRepository,
		private readonly botService: BotService,
		private readonly chatRecorder: ChatRecorder,
	) {}

	async findMany(query: ReminderFindManyRequestDto) {
		const data = await this.repository.findMany(query)
		return createResponse({ data, success: { messages: ['get many success'] } })
	}

	async findOne(id: string) {
		const reminder = await this.repository.findOne(id)
		if (!reminder) throw new BadRequestException(ERROR_MSG.REMINDER.NOT_FOUND.UZ)
		return createResponse({ data: reminder, success: { messages: ['get one success'] } })
	}

	async createOne(body: ReminderCreateOneRequestDto) {
		await this.requireClient(body.clientId)
		const reminder = await this.repository.create({
			clientId: body.clientId,
			startDate: toUtcDateOnly(body.startDate),
			description: body.description.trim(),
		})
		return createResponse({ data: reminder, success: { messages: ['create one success'] } })
	}

	async updateOne(id: string, body: ReminderUpdateOneRequestDto) {
		await this.findOne(id)
		const reminder = await this.repository.update(id, {
			...(body.description !== undefined ? { description: body.description.trim() } : {}),
			...(body.startDate !== undefined ? { startDate: toUtcDateOnly(body.startDate) } : {}),
		})
		return createResponse({ data: reminder, success: { messages: ['update one success'] } })
	}

	async deleteOne(id: string) {
		await this.findOne(id)
		await this.repository.softDelete(id)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async dispatchDue(now = new Date()): Promise<ReminderDispatchResult> {
		const today = tashkentToday(now)
		const due = await this.repository.findDue(today)
		const lines: string[] = []
		let sentToClients = 0
		let skippedNoTelegram = 0
		let waitingForBot = 0

		let lineNo = 0
		for (const reminder of due) {
			const telegram = reminder.client.telegram
			const canSend = !!telegram?.id && telegram.isActive !== false
			if (!canSend) {
				await this.repository.markSent(reminder.id, today)
				skippedNoTelegram += 1
				lines.push(`${++lineNo}. ${this.personLine(reminder.client)}: ${reminder.description} — telegram yo'q`)
				continue
			}
			const text = `eslatma: ${reminder.description}`
			const messageId = await this.botService.sendTextToClient(telegram.id, text)
			if (!messageId) {
				waitingForBot += 1
				continue
			}
			await this.chatRecorder
				.save({
					clientId: reminder.client.id,
					direction: 'system',
					kind: 'text',
					text,
					telegramMessageId: messageId,
				})
				.catch((error) => this.logger.error(`reminder chat save failed: ${error?.message ?? error}`))
			await this.repository.markSent(reminder.id, today)
			sentToClients += 1
			lines.push(`${++lineNo}. ${this.personLine(reminder.client)}: ${reminder.description}`)
		}

		const digest = lines.length ? `Eslatmalar (${moment.tz(now, TZ).format('DD.MM.YYYY')})\n\n${lines.join('\n')}` : ''
		let channelDelivered = false
		if (digest) {
			const parts = splitTelegramText(digest, TELEGRAM_LIMIT)
			const results = await Promise.all(parts.map((part) => this.botService.sendReminderChannelMessage(part)))
			channelDelivered = results.every(Boolean)
		}

		return {
			processed: sentToClients + skippedNoTelegram,
			sentToClients,
			skippedNoTelegram,
			waitingForBot,
			channelDelivered,
			digest,
		}
	}

	private personLine(client: { fullname: string; phone: string | null }) {
		return client.phone ? `${client.fullname} (${client.phone})` : client.fullname
	}

	private async requireClient(clientId: string) {
		const client = await this.prisma.clientModel.findFirst({ where: { id: clientId }, select: { id: true } })
		if (!client) throw new BadRequestException(ERROR_MSG.CLIENT.NOT_FOUND.UZ)
		return client
	}
}

export function tashkentToday(now = new Date()): Date {
	return new Date(`${moment.tz(now, TZ).format('YYYY-MM-DD')}T00:00:00.000Z`)
}

export function toUtcDateOnly(value: string | Date): Date {
	return new Date(`${moment.tz(value, TZ).format('YYYY-MM-DD')}T00:00:00.000Z`)
}

export function splitTelegramText(text: string, limit = TELEGRAM_LIMIT): string[] {
	if (text.length <= limit) return [text]
	const parts: string[] = []
	let rest = text
	while (rest.length > limit) {
		let cut = rest.lastIndexOf('\n', limit)
		if (cut < limit / 2) cut = limit
		parts.push(rest.slice(0, cut))
		rest = rest.slice(cut).replace(/^\n/, '')
	}
	if (rest) parts.push(rest)
	return parts
}
