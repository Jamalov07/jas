import { forwardRef, Inject, Injectable, Optional } from '@nestjs/common'
import { PdfService } from '../shared/pdf'
import { PrismaService } from '../shared/prisma'
import { Context, Markup, Telegraf } from 'telegraf'
import { BotLanguageEnum } from '@prisma/client'
import { InjectBot } from 'nestjs-telegraf'
import { MyBotName } from './constants'
import { ConfigService } from '@nestjs/config'
import { SellingFindOneData, SellingPaymentData, SellingProductData } from '../selling'
import { buildSellingChannelSummaryBlock } from '../selling/helpers/selling-channel-summary.helper'
import { ClientFindOneData } from '../client'
import { BotSellingProductTitleEnum, BotSellingTitleEnum } from '../selling/enums'
import { Decimal } from '@prisma/client/runtime/library'
import { CurrencyBrief, formatDdMmYyyyHhMmForUzDisplay } from '../../common'
import axios from 'axios'
import { ChatRecorder } from '../chat/chat.recorder'

type BotSellingData = Omit<SellingFindOneData, 'products'> & {
	title?: BotSellingTitleEnum
	debtByCurrency?: {
		currencyId: string
		total?: Decimal
		amount?: Decimal
		currency: { id: string; name: string; symbol: string }
	}[]
	products?: Array<SellingProductData & { status?: BotSellingProductTitleEnum }>
}

type PaymentMethod = { type: string; amount: Decimal; currency?: CurrencyBrief }
type DebtEntry = { currencyId: string; amount: Decimal; currency: CurrencyBrief }

@Injectable()
export class BotService {
	private readonly prisma: PrismaService
	private readonly pdfService: PdfService
	private readonly configService: ConfigService
	constructor(
		prisma: PrismaService,
		pdfService: PdfService,
		configService: ConfigService,
		@Inject(forwardRef(() => ChatRecorder)) private readonly chatRecorder: ChatRecorder,
		@Optional() @InjectBot(MyBotName) private readonly bot?: Telegraf<Context>,
	) {
		this.prisma = prisma
		this.pdfService = pdfService
		this.configService = configService
	}

	private isBotEnabled(): boolean {
		return !!this.bot
	}

	private getSellingChannelId(): string | undefined {
		return this.configService.get<string>('bot.sellingChannelId')
	}

	private getPaymentChannelId(): string | undefined {
		return this.configService.get<string>('bot.paymentChannelId')
	}

	private getReminderChannelId(): string | undefined {
		return this.configService.get<string>('bot.reminderChannelId')
	}

	async onStart(context: Context) {
		const user = await this.findBotUserById(context.from.id)
		if (user) {
			if (user.language) {
				if (user.clientId) {
					context.reply(`${user.client.fullname} siz allaqachon ro'yhatdan o'tgansiz!`)
				} else {
					context.reply("Ro'yhatdan o'tish uchun telefon raqam yuborish tugmasini bosing.", {
						parse_mode: 'HTML',
						reply_markup: Markup.keyboard([[Markup.button.contactRequest('📲 Raqam yuborish')]])
							.oneTime()
							.resize().reply_markup,
					})
				}
			} else {
				await context.reply("O'zingizga qulay bo'lgan tilni tanlang.", {
					parse_mode: 'HTML',
					reply_markup: Markup.keyboard([["O'zbek tili"], ['Русскый язык'], ['English language']])
						.oneTime()
						.resize().reply_markup,
				})
			}
		} else {
			await this.createBotUserWithId(context.from.id)
			await context.reply("O'zingizga qulay bo'lgan tilni tanlang.", {
				parse_mode: 'HTML',
				...Markup.keyboard([["O'zbek tili"], ['Русскый язык'], ['English language']])
					.oneTime()
					.resize(),
			})
		}
	}

	async onSelectLanguage(context: Context, language: BotLanguageEnum) {
		const user = await this.findBotUserById(context.from.id)

		if (user) {
			await this.updateBotUserWithId(context.from.id, { language: language })
			await context.reply("Ro'yhatdan o'tish uchun telefon raqam yuborish tugmasini bosing.", {
				parse_mode: 'HTML',
				...Markup.keyboard([[Markup.button.contactRequest('📲 Raqam yuborish')]])
					.oneTime()
					.resize(),
			})
		} else {
			await this.createBotUserWithId(context.from.id)
			await context.reply("Hayrli kun. O'zingizga qulay bo'lgan tilni tanlang.", {
				parse_mode: 'HTML',
				...Markup.keyboard([["O'zbek tili"], ['Русскый язык'], ['English language']])
					.oneTime()
					.resize(),
			})
		}
	}

	async onContact(context: Context) {
		const user = await this.findBotUserById(context.from.id)
		if (user && 'contact' in context.message) {
			if (user.language) {
				const client = await this.findClientByPhone(context.message.contact.phone_number)
				if (client) {
					await this.updateBotUserWithId(context.from.id, { clientId: client.id })
					await context.reply("Tabriklaymiz. Muvaffaqiyatli ro'yhatdan o'tdingiz!", {
						reply_markup: { remove_keyboard: true },
					})
				} else {
					await context.reply("Bizda sizning ma'lumotlar topilmadi.")
				}
			} else {
				await this.createBotUserWithId(context.from.id)
				await context.reply("Hayrli kun. O'zingizga qulay bo'lgan tilni tanlang.", {
					parse_mode: 'HTML',
					...Markup.keyboard([["O'zbek tili"], ['Русскый язык'], ['English language']])
						.oneTime()
						.resize(),
				})
			}
		} else {
			await this.createBotUserWithId(context.from.id)
			await context.reply("Hayrli kun. O'zingizga qulay bo'lgan tilni tanlang.", {
				parse_mode: 'HTML',
				...Markup.keyboard([["O'zbek tili"], ['Русскый язык'], ['English language']])
					.oneTime()
					.resize(),
			})
		}
	}

	async onIncomingText(context: Context) {
		const message = context.message
		if (!message || !('text' in message) || !context.from) return
		await this.chatRecorder.ingestTelegram({
			telegramUserId: String(context.from.id),
			telegramMessageId: message.message_id,
			text: message.text,
		})
	}

	async onIncomingPhoto(context: Context) {
		const message = context.message
		if (!message || !('photo' in message) || !context.from || !message.photo?.length) return
		const photo = message.photo[message.photo.length - 1]
		const buffer = await this.downloadTelegramFile(photo.file_id)
		await this.chatRecorder.ingestTelegram({
			telegramUserId: String(context.from.id),
			telegramMessageId: message.message_id,
			text: 'caption' in message ? (message.caption ?? null) : null,
			file: { buffer, fileName: 'photo.jpg', mimeType: 'image/jpeg', kind: 'photo' },
		})
	}

	async onIncomingDocument(context: Context) {
		const message = context.message
		if (!message || !('document' in message) || !context.from) return
		const document = message.document
		const buffer = await this.downloadTelegramFile(document.file_id)
		await this.chatRecorder.ingestTelegram({
			telegramUserId: String(context.from.id),
			telegramMessageId: message.message_id,
			text: 'caption' in message ? (message.caption ?? null) : null,
			file: {
				buffer,
				fileName: document.file_name || 'document',
				mimeType: document.mime_type || 'application/octet-stream',
				kind: 'document',
			},
		})
	}

	async sendTextToClient(telegramId: string, text: string): Promise<number | null> {
		if (!this.isBotEnabled()) return null
		try {
			const sent = await this.bot!.telegram.sendMessage(telegramId, text)
			return sent.message_id
		} catch (error) {
			console.log('bot send text error:', error)
			return null
		}
	}

	async sendFileToClient(telegramId: string, buffer: Buffer, fileName: string, mimeType: string, caption?: string): Promise<number | null> {
		if (!this.isBotEnabled()) return null
		try {
			const source = { source: buffer, filename: fileName }
			const extra = caption ? { caption } : {}
			const sent = mimeType.startsWith('image/') ? await this.bot!.telegram.sendPhoto(telegramId, source, extra) : await this.bot!.telegram.sendDocument(telegramId, source, extra)
			return sent.message_id
		} catch (error) {
			console.log('bot send file error:', error)
			return null
		}
	}

	async deleteTelegramMessage(telegramId: string, messageId: number): Promise<boolean> {
		if (!this.isBotEnabled()) return false
		try {
			await this.bot!.telegram.deleteMessage(telegramId, messageId)
			return true
		} catch (error) {
			console.log('bot delete message error:', error)
			return false
		}
	}

	async sendReminderChannelMessage(text: string): Promise<boolean> {
		if (!this.isBotEnabled()) return false
		const channelId = this.getReminderChannelId()
		if (!channelId) return false
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return false
		try {
			await this.bot!.telegram.sendMessage(channelId, text)
			return true
		} catch (error) {
			console.log('bot reminder channel error:', error)
			return false
		}
	}

	private async downloadTelegramFile(fileId: string): Promise<Buffer> {
		const link = await this.bot!.telegram.getFileLink(fileId)
		const response = await axios.get<ArrayBuffer>(link.href, { responseType: 'arraybuffer' })
		return Buffer.from(response.data)
	}

	// ─── Selling notifications ────────────────────────────────────────────────

	private formatTotalPrices(selling: BotSellingData): string {
		if (!selling.totalPrices?.length) return '0'
		return selling.totalPrices.map((t) => `${t.total.toNumber()} ${(t as any).currency?.symbol ?? ''}`).join(' + ')
	}

	private getProductPrice(product: SellingProductData): number {
		const p = product.prices as any
		if (p && typeof p === 'object' && !Array.isArray(p) && p.selling?.price) {
			return p.selling.price.toNumber?.() ?? 0
		}
		if (Array.isArray(p) && p[0]?.price) {
			return p[0].price.toNumber?.() ?? 0
		}
		return 0
	}

	private buildSellingCaption(selling: BotSellingData): string {
		const summary = buildSellingChannelSummaryBlock(selling, (d) => this.formatDate(d)).trimEnd()

		const findProductByStatus = (status: BotSellingProductTitleEnum) => selling.products?.find((p) => p.status === status)

		let productInfo = ''

		switch (selling.title) {
			case BotSellingTitleEnum.new:
				return `✅ Yangi sotuv\n\n${summary}`

			case BotSellingTitleEnum.added: {
				const p = findProductByStatus(BotSellingProductTitleEnum.new)
				if (p) productInfo = `\n📦 Mahsulot qo'shildi\n` + `• Nomi: ${p.product.name}\n` + `• Narxi: ${this.getProductPrice(p)}\n` + `• Soni: ${p.count}`
				return `${summary}${productInfo}`
			}

			case BotSellingTitleEnum.updated: {
				const p = findProductByStatus(BotSellingProductTitleEnum.updated)
				if (p) productInfo = `\n♻️ Mahsulot yangilandi\n` + `• Nomi: ${p.product.name}\n` + `• Narxi: ${this.getProductPrice(p)}\n` + `• Soni: ${p.count}`
				return `${summary}${productInfo}`
			}

			case BotSellingTitleEnum.deleted: {
				const p = findProductByStatus(BotSellingProductTitleEnum.deleted)
				if (p) productInfo = `\n🗑️ Mahsulot o'chirildi\n` + `• Nomi: ${p.product.name}\n` + `• Narxi: ${this.getProductPrice(p)}\n` + `• Soni: ${p.count}`
				return `${summary}${productInfo}`
			}

			default:
				return summary
		}
	}

	async sendSellingToClient(selling: BotSellingData) {
		if (!this.isBotEnabled()) return
		const telegramId = selling.client?.telegram?.id
		if (!telegramId) return
		const bufferPdf = await this.pdfService.generateInvoicePdfBuffer2(selling as any)
		const sent = await this.bot!.telegram.sendDocument(telegramId, { source: bufferPdf, filename: `xarid.pdf` }, { caption: this.buildSellingCaption(selling) })
		const clientId = selling.client?.id as string | undefined
		if (clientId) {
			await this.chatRecorder
				.save({
					clientId,
					direction: 'system',
					kind: 'document',
					text: this.buildSellingCaption(selling),
					telegramMessageId: sent.message_id,
					sellingId: selling.id,
					file: { buffer: bufferPdf, fileName: 'xarid.pdf', mimeType: 'application/pdf' },
				})
				.catch((error) => console.log('chat pdf error:', error))
		}
	}

	async sendSellingToChannel(selling: BotSellingData) {
		if (!this.isBotEnabled()) return
		const channelId = this.getSellingChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const bufferPdf = await this.pdfService.generateInvoicePdfBuffer2(selling as any)
		await this.bot!.telegram.sendDocument(
			channelId,
			{ source: bufferPdf, filename: `${selling.client?.phone ?? 'xarid'}.pdf` },
			{
				caption: this.buildSellingCaption(selling),
			},
		)
	}

	async sendDeletedSellingToChannel(selling: BotSellingData) {
		if (!this.isBotEnabled()) return
		const channelId = this.getSellingChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const baseInfo = `🧾 Sotuv\n\n` + `🆔 Buyurtma: ${selling.publicId ?? selling.id}\n` + `💰 Jami: ${this.formatTotalPrices(selling)}\n`
		const clientInfo = `👤 Xaridor: ${selling.client?.fullname ?? ''}\n` + `📊 Jami qarz: ${this.formatDebt(selling.client?.debtByCurrency ?? [])}`
		await this.bot!.telegram.sendMessage(channelId, `🗑️ Sotuv o'chirildi\n\n${baseInfo}\n\n${clientInfo}`)
	}

	async sendDeletedSellingToClient(selling: BotSellingData) {
		if (!this.isBotEnabled()) return
		const telegramId = selling.client?.telegram?.id
		if (!telegramId) return
		const baseInfo = `🧾 Sotuv\n\n` + `🆔 Buyurtma: ${selling.publicId ?? selling.id}\n` + `💰 Jami: ${this.formatTotalPrices(selling)}\n`
		const clientInfo = `👤 Xaridor: ${selling.client?.fullname ?? ''}\n` + `📊 Jami qarz: ${this.formatDebt(selling.client?.debtByCurrency ?? [])}`
		await this.bot!.telegram.sendMessage(telegramId, `🗑️ Sotuv o'chirildi\n\n${baseInfo}\n\n${clientInfo}`)
	}

	async sendDeletedPaymentToClient(payment: SellingPaymentData, client: ClientFindOneData) {
		if (!this.isBotEnabled()) return
		const telegramId = client.telegram?.id
		if (!telegramId) return
		const message = this.buildPaymentMessage({
			prefix: `🗑️ O'chirildi\n\n`,
			person: { fullname: client.fullname, phone: client.phone },
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})
		await this.bot!.telegram.sendMessage(telegramId, message)
	}

	private formatDebt(debtByCurrency: DebtEntry[]): string {
		const nonzero = debtByCurrency.filter((d) => d.amount && !d.amount.isZero())
		if (!nonzero.length) return '0'
		return nonzero.map((d) => `${d.amount.toNumber()} ${d.currency.symbol}`).join(' + ')
	}

	private buildPaymentMessage(params: {
		prefix: string
		person: { fullname: string; phone: string }
		paymentMethods: PaymentMethod[]
		changeMethods?: PaymentMethod[]
		description?: string | null
		date: Date
		debtByCurrency: DebtEntry[]
	}): string {
		const cm = params.changeMethods ?? []
		const total = [...params.paymentMethods, ...cm].reduce((acc, m) => acc.plus(m.amount), new Decimal(0))
		const total2 = params.paymentMethods.map((payment) => `${payment.amount.toNumber()} ${payment.currency.symbol}`).join(' + ')
		const byType = (type: string) => params.paymentMethods.filter((m) => m.type === type).reduce((acc, m) => acc.plus(m.amount), new Decimal(0))
		const changeTotal = cm.reduce((acc, m) => acc.plus(m.amount), new Decimal(0))
		const change2 = params.changeMethods.map((change) => `${change.amount.toNumber()} ${change.currency.symbol}`).join(' + ')

		return (
			`${params.prefix}` +
			`👤 Xaridor: ${params.person.fullname}\n` +
			`📞 Telefon raqam: ${params.person.phone}\n\n` +
			// `💰 Сумма: ${total.toNumber()}\n\n` +
			`💰 Jami: ${total2 || 0}\n` +
			// `💵 Наличными: ${byType('cash').toNumber()}\n` +
			// `💳 Картой: ${byType('card').toNumber()}\n` +
			// `🏦 Переводом: ${byType('transfer').toNumber()}\n` +
			// `📦 Другое: ${byType('other').toNumber()}\n` +
			// `🔁 Сдачa: ${changeTotal.toNumber()}\n` +
			`🔁 Qaytim: ${change2 || 0}\n` +
			`📅 Vaqt: ${this.formatDate(params.date)}\n` +
			`📝 Tafsilot: ${params.description ?? '-'}\n` +
			`📊 Jami qarz: ${this.formatDebt(params.debtByCurrency)}`
		)
	}

	// ─── Selling payment notifications ────────────────────────────────────────

	async sendPaymentToChannel(payment: SellingPaymentData, isModified: boolean = false, client: ClientFindOneData) {
		if (!this.isBotEnabled()) return
		const channelId = this.getPaymentChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const message = this.buildPaymentMessage({
			prefix: isModified ? '♻️ Yangilandi\n\n' : '',
			person: { fullname: client.fullname, phone: client.phone },
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})
		await this.bot!.telegram.sendMessage(channelId, message)
	}

	async sendPaymentToClient(payment: SellingPaymentData, client: ClientFindOneData) {
		if (!this.isBotEnabled()) return
		const telegramId = client.telegram?.id
		if (!telegramId) return
		const message = this.buildPaymentMessage({
			prefix: '',
			person: { fullname: client.fullname, phone: client.phone },
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})
		await this.bot!.telegram.sendMessage(telegramId, message)
	}

	async sendDeletedPaymentToChannel(payment: SellingPaymentData, client: ClientFindOneData) {
		if (!this.isBotEnabled()) return
		const channelId = this.getPaymentChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const message = this.buildPaymentMessage({
			prefix: `🗑️ O'chirildi\n\n`,
			person: { fullname: client.fullname, phone: client.phone },
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})
		await this.bot!.telegram.sendMessage(channelId, message)
	}

	// ─── Client standalone payment notifications ──────────────────────────────

	async sendClientPaymentToChannel(
		payment: {
			description?: string | null
			createdAt: Date
			paymentMethods: PaymentMethod[]
			changeMethods?: PaymentMethod[]
			client: { fullname: string; phone: string }
		},
		isModified: boolean,
		debtByCurrency: DebtEntry[],
	) {
		if (!this.isBotEnabled()) return
		const channelId = this.getPaymentChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const message = this.buildPaymentMessage({
			prefix: isModified ? `♻️ Yangilandi (xaridor to'lovi)\n\n` : `💳 Xaridor to'lovi\n\n`,
			person: payment.client,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})
		await this.bot!.telegram.sendMessage(channelId, message)
	}

	async sendDeletedClientPaymentToChannel(
		payment: {
			description?: string | null
			createdAt: Date
			paymentMethods: PaymentMethod[]
			changeMethods?: PaymentMethod[]
			client: { fullname: string; phone: string }
		},
		debtByCurrency: DebtEntry[],
	) {
		if (!this.isBotEnabled()) return
		const channelId = this.getPaymentChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const message = this.buildPaymentMessage({
			prefix: `🗑️ O'chirildi (xaridor to'lovi)\n\n`,
			person: payment.client,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})
		await this.bot!.telegram.sendMessage(channelId, message)
	}

	async sendClientPaymentToClient(
		payment: {
			description?: string | null
			createdAt: Date
			paymentMethods: PaymentMethod[]
			changeMethods?: PaymentMethod[]
			client: { fullname: string; phone: string }
		},
		isModified: boolean,
		client: ClientFindOneData,
	) {
		if (!this.isBotEnabled()) return
		const telegramId = client.telegram?.id
		if (!telegramId) return
		const message = this.buildPaymentMessage({
			prefix: isModified ? `♻️ Yangilandi (xaridor to'lovi)\n\n` : `💳 Xaridor to'lovi\n\n`,
			person: payment.client,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})
		await this.bot!.telegram.sendMessage(telegramId, message)
	}

	async sendDeletedClientPaymentToClient(
		payment: {
			description?: string | null
			createdAt: Date
			paymentMethods: PaymentMethod[]
			changeMethods?: PaymentMethod[]
			client: { fullname: string; phone: string }
		},
		client: ClientFindOneData,
	) {
		if (!this.isBotEnabled()) return
		const telegramId = client.telegram?.id
		if (!telegramId) return
		const message = this.buildPaymentMessage({
			prefix: `🗑️ O'chirildi (xaridor to'lovi)\n\n`,
			person: payment.client,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})
		await this.bot!.telegram.sendMessage(telegramId, message)
	}

	// ─── Supplier payment notifications ───────────────────────────────────────

	async sendSupplierPaymentToChannel(
		payment: {
			description?: string | null
			createdAt: Date
			paymentMethods: PaymentMethod[]
			changeMethods?: PaymentMethod[]
			supplier: { fullname: string; phone: string }
		},
		isModified: boolean,
		debtByCurrency: DebtEntry[],
	) {
		if (!this.isBotEnabled()) return
		const channelId = this.getPaymentChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const message = this.buildPaymentMessage({
			prefix: isModified ? `♻️ Yangilandi (yetkazib beruvchi to'lovi)\n\n` : `💳 Yetkazib beruvchi to'lovi\n\n`,
			person: payment.supplier,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})
		await this.bot!.telegram.sendMessage(channelId, message)
	}

	async sendDeletedSupplierPaymentToChannel(
		payment: {
			description?: string | null
			createdAt: Date
			paymentMethods: PaymentMethod[]
			changeMethods?: PaymentMethod[]
			supplier: { fullname: string; phone: string }
		},
		debtByCurrency: DebtEntry[],
	) {
		if (!this.isBotEnabled()) return
		const channelId = this.getPaymentChannelId()
		if (!channelId) return
		const chatInfo = await this.bot!.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return
		const message = this.buildPaymentMessage({
			prefix: `🗑️ O'chirildi (yetkazib beruvchi to'lovi)\n\n`,
			person: payment.supplier,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})
		await this.bot!.telegram.sendMessage(channelId, message)
	}

	// ─── Private helpers ──────────────────────────────────────────────────────

	private async findBotUserById(id: number | string) {
		const user = await this.prisma.botUserModel.findFirst({
			where: { id: String(id) },
			select: { id: true, language: true, isActive: true, clientId: true, client: true },
		})
		return user
	}

	private async createBotUserWithId(id: number | string) {
		return this.prisma.botUserModel.create({ data: { id: String(id) } })
	}

	private async updateBotUserWithId(id: number | string, body: { clientId?: string; language?: BotLanguageEnum }) {
		return this.prisma.botUserModel.update({ where: { id: String(id) }, data: { language: body.language, clientId: body.clientId } })
	}

	private async findClientByPhone(phone: string) {
		const cleanedPhone = phone.replace(/^\+/, '')
		return await this.prisma.clientModel.findFirst({ where: { phone: cleanedPhone } })
	}

	private formatDate(date: Date): string {
		return formatDdMmYyyyHhMmForUzDisplay(date)
	}
}
