/* eslint-disable @typescript-eslint/require-await */
import { Injectable } from '@nestjs/common'
import { PdfService, PrismaService } from '../shared'
import { Context, Markup, Telegraf } from 'telegraf'
import { BotLanguageEnum } from '@prisma/client'
import { InjectBot } from 'nestjs-telegraf'
import { MyBotName } from './constants'
import { ConfigService } from '@nestjs/config'
import { SellingFindOneData, SellingPaymentData, SellingProductData } from '../selling'
import { ClientFindOneData } from '../client'
import { BotSellingProductTitleEnum, BotSellingTitleEnum } from '../selling/enums'
import { Decimal } from '@prisma/client/runtime/library'
import { CurrencyBrief } from '../../common'

type BotSellingData = Omit<SellingFindOneData, 'products'> & {
	title?: BotSellingTitleEnum
	debtByCurrency?: { currencyId: string; total?: Decimal; amount?: Decimal; currency: { id: string; name: string; symbol: string } }[]
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
		@InjectBot(MyBotName) private readonly bot: Telegraf<Context>,
	) {
		this.prisma = prisma
		this.pdfService = pdfService
		this.configService = configService
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
		console.log(selling.debtByCurrency)
		const baseInfo =
			`🧾 Продажа\n\n` +
			`🆔 Заказ: ${selling.publicId ?? selling.id}\n` +
			`💰 Сумма: ${this.formatTotalPrices(selling)}\n` +
			`💸 Долг: ${(selling.debtByCurrency ?? []).map((debt) => `${debt.amount.toNumber()} ${debt.currency.symbol}`).join(' + ') || 0}`

		const clientInfo = `👤 Клиент: ${selling.client?.fullname ?? ''}\n` + `📊 Общий долг: ${this.formatDebt(selling.client?.debtByCurrency ?? [])}\n`

		const findProductByStatus = (status: BotSellingProductTitleEnum) => selling.products?.find((p) => p.status === status)

		let productInfo = ''

		switch (selling.title) {
			case BotSellingTitleEnum.new:
				return `🧾 Новая продажа\n\n${baseInfo}\n${clientInfo}`

			case BotSellingTitleEnum.added: {
				const p = findProductByStatus(BotSellingProductTitleEnum.new)
				if (p) productInfo = `\n📦 Товар добавлен\n` + `• Название: ${p.product.name}\n` + `• Цена: ${this.getProductPrice(p)}\n` + `• Кол-во: ${p.count}`
				return `${baseInfo}${productInfo}\n\n${clientInfo}`
			}

			case BotSellingTitleEnum.updated: {
				const p = findProductByStatus(BotSellingProductTitleEnum.updated)
				if (p) productInfo = `\n♻️ Товар обновлён\n` + `• Название: ${p.product.name}\n` + `• Цена: ${this.getProductPrice(p)}\n` + `• Кол-во: ${p.count}`
				return `${baseInfo}${productInfo}\n\n${clientInfo}`
			}

			case BotSellingTitleEnum.deleted: {
				const p = findProductByStatus(BotSellingProductTitleEnum.deleted)
				if (p) productInfo = `\n🗑️ Товар удалён\n` + `• Название: ${p.product.name}\n` + `• Цена: ${this.getProductPrice(p)}\n` + `• Кол-во: ${p.count}`
				return `${baseInfo}${productInfo}\n\n${clientInfo}`
			}

			default:
				return `${baseInfo}\n${clientInfo}`
		}
	}

	async sendSellingToClient(selling: BotSellingData) {
		const telegramId = selling.client?.telegram?.id
		if (!telegramId) return

		const bufferPdf = await this.pdfService.generateInvoicePdfBuffer2(selling as any)
		await this.bot.telegram.sendDocument(telegramId, { source: bufferPdf, filename: `xarid.pdf` }, { caption: this.buildSellingCaption(selling) })
	}

	async sendSellingToChannel(selling: BotSellingData) {
		const channelId = this.configService.getOrThrow<string>('bot.sellingChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const bufferPdf = await this.pdfService.generateInvoicePdfBuffer2(selling as any)
		await this.bot.telegram.sendDocument(
			channelId,
			{ source: bufferPdf, filename: `${selling.client?.phone ?? 'chek'}.pdf` },
			{
				caption: this.buildSellingCaption(selling),
			},
		)
	}

	async sendDeletedSellingToChannel(selling: BotSellingData) {
		const channelId = this.configService.getOrThrow<string>('bot.sellingChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const baseInfo = `🧾 Продажа\n\n` + `🆔 Заказ: ${selling.publicId ?? selling.id}\n` + `💰 Сумма: ${this.formatTotalPrices(selling)}\n`

		const clientInfo = `👤 Клиент: ${selling.client?.fullname ?? ''}\n` + `📊 Общий долг: ${this.formatDebt(selling.client?.debtByCurrency ?? [])}`

		await this.bot.telegram.sendMessage(channelId, `🗑️ Продажа удалено\n\n${baseInfo}\n\n${clientInfo}`)
	}

	// ─── Payment notifications (shared helper) ────────────────────────────────

	private formatDebt(debtByCurrency: DebtEntry[]): string {
		if (!debtByCurrency.length) return '0'
		return debtByCurrency.map((d) => `${d.amount.toNumber()} ${d.currency.symbol}`).join(' + ')
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
			`👤 Клиент: ${params.person.fullname}\n` +
			`📞 Телефон: ${params.person.phone}\n\n` +
			// `💰 Сумма: ${total.toNumber()}\n\n` +
			`💰 Сумма: ${total2 || 0}\n` +
			// `💵 Наличными: ${byType('cash').toNumber()}\n` +
			// `💳 Картой: ${byType('card').toNumber()}\n` +
			// `🏦 Переводом: ${byType('transfer').toNumber()}\n` +
			// `📦 Другое: ${byType('other').toNumber()}\n` +
			// `🔁 Сдачa: ${changeTotal.toNumber()}\n` +
			`🔁 Сдачa: ${change2 || 0}\n` +
			`📅 Дата: ${this.formatDate(params.date)}\n` +
			`📝 Описание: ${params.description ?? '-'}\n` +
			`📊 Общий долг: ${this.formatDebt(params.debtByCurrency)}`
		)
	}

	// ─── Selling payment notifications ────────────────────────────────────────

	async sendPaymentToChannel(payment: SellingPaymentData, isModified: boolean = false, client: ClientFindOneData) {
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const message = this.buildPaymentMessage({
			prefix: isModified ? '♻️ Обновлено\n\n' : '',
			person: { fullname: client.fullname, phone: client.phone },
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})

		await this.bot.telegram.sendMessage(channelId, message)
	}

	async sendDeletedPaymentToChannel(payment: SellingPaymentData, client: ClientFindOneData) {
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const message = this.buildPaymentMessage({
			prefix: '🗑️ Удалено\n\n',
			person: { fullname: client.fullname, phone: client.phone },
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency: client.debtByCurrency ?? [],
		})

		await this.bot.telegram.sendMessage(channelId, message)
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
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const message = this.buildPaymentMessage({
			prefix: isModified ? '♻️ Обновлено (оплата клиента)\n\n' : '💳 Оплата клиента\n\n',
			person: payment.client,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})

		await this.bot.telegram.sendMessage(channelId, message)
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
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const message = this.buildPaymentMessage({
			prefix: '🗑️ Удалено (оплата клиента)\n\n',
			person: payment.client,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})

		await this.bot.telegram.sendMessage(channelId, message)
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
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const message = this.buildPaymentMessage({
			prefix: isModified ? '♻️ Обновлено (оплата поставщику)\n\n' : '💳 Оплата поставщику\n\n',
			person: payment.supplier,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})

		await this.bot.telegram.sendMessage(channelId, message)
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
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const message = this.buildPaymentMessage({
			prefix: '🗑️ Удалено (оплата поставщику)\n\n',
			person: payment.supplier,
			paymentMethods: payment.paymentMethods ?? [],
			changeMethods: payment.changeMethods ?? [],
			description: payment.description,
			date: payment.createdAt,
			debtByCurrency,
		})

		await this.bot.telegram.sendMessage(channelId, message)
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
		const dd = String(date.getDate()).padStart(2, '0')
		const mm = String(date.getMonth() + 1).padStart(2, '0')
		const yyyy = date.getFullYear()
		const hh = String(date.getHours()).padStart(2, '0')
		const min = String(date.getMinutes()).padStart(2, '0')
		return `${dd}.${mm}.${yyyy} ${hh}:${min}`
	}
}
