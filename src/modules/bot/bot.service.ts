import { Injectable } from '@nestjs/common'
import { PdfService, PrismaService } from '../shared'
import { Context, Markup, Telegraf } from 'telegraf'
import { Message } from 'telegraf/typings/core/types/typegram'
import { BotLanguageEnum, PaymentModel, ServiceTypeEnum } from '@prisma/client'
import { SellingFindOneData } from '../selling'
import { InjectBot } from 'nestjs-telegraf'
import { MyBotName } from './constants'
import { ConfigService } from '@nestjs/config'
import { BotSellingProductTitleEnum, BotSellingTitleEnum } from '../selling/enums'
import { ClientFindOneData } from '../client'

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
				if (user.userId) {
					context.reply(`${user.user.fullname} siz allaqachon ro'yhatdan o'tgansiz!`)
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
			const user2 = await this.updateBotUserWithId(context.from.id, { language: language })
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
				const usr = await this.findUserByPhone(context.message.contact.phone_number)
				if (usr) {
					await this.updateBotUserWithId(context.from.id, { userId: usr.id })
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

	async sendSellingToClient(selling: SellingFindOneData) {
		const bufferPdf = await this.pdfService.generateInvoicePdfBuffer2(selling)

		let caption = ''
		const baseInfo = `🧾 Продажа\n\n` + `🆔 Заказ: ${selling.publicId}\n` + `💰 Сумма: ${selling.totalPrice.toNumber()}\n` + `💸 Долг: ${selling.debt.toNumber()}\n`

		const clientInfo = `👤 Клиент: ${selling.client.fullname}\n` + `📊 Общий долг: ${selling.client.debt.toNumber()}`

		let productInfo = ''

		const findProductByStatus = (status: BotSellingProductTitleEnum) => selling.products.find((prod) => prod.status === status)

		switch (selling.title) {
			case BotSellingTitleEnum.new:
				caption = `🧾 Новая продажа\n\n${baseInfo}\n${clientInfo}`
				break

			case BotSellingTitleEnum.added: {
				const newProduct = findProductByStatus(BotSellingProductTitleEnum.new)
				if (newProduct) {
					productInfo = `\n📦 Товар добавлен\n` + `• Название: ${newProduct.product.name}\n` + `• Цена: ${newProduct.price.toNumber()}\n` + `• Кол-во: ${newProduct.count}`
				}
				caption = `${baseInfo}${productInfo}\n\n${clientInfo}`
				break
			}

			case BotSellingTitleEnum.updated: {
				const updatedProduct = findProductByStatus(BotSellingProductTitleEnum.updated)
				if (updatedProduct) {
					productInfo =
						`\n♻️ Товар обновлён\n` + `• Название: ${updatedProduct.product.name}\n` + `• Цена: ${updatedProduct.price.toNumber()}\n` + `• Кол-во: ${updatedProduct.count}`
				}
				caption = `${baseInfo}${productInfo}\n\n${clientInfo}`
				break
			}

			case BotSellingTitleEnum.deleted: {
				const deletedProduct = findProductByStatus(BotSellingProductTitleEnum.deleted)
				if (deletedProduct) {
					productInfo =
						`\n🗑️ Товар удалён\n` + `• Название: ${deletedProduct.product.name}\n` + `• Цена: ${deletedProduct.price.toNumber()}\n` + `• Кол-во: ${deletedProduct.count}`
				}
				caption = `${baseInfo}${productInfo}\n\n${clientInfo}`
				break
			}

			default:
				caption = `${baseInfo}\n${clientInfo}`
				break
		}

		await this.bot.telegram.sendDocument(selling.client.telegram?.id, { source: bufferPdf, filename: `xarid.pdf` }, { caption })
	}

	async sendDeletedSellingToChannel(selling: SellingFindOneData) {
		const channelId = this.configService.getOrThrow<string>('bot.sellingChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		let caption = ''
		const baseInfo = `🧾 Продажа\n\n` + `🆔 Заказ: ${selling.publicId}\n` + `💰 Сумма: ${selling.totalPrice.toNumber()}\n` + `💸 Долг: ${selling.debt.toNumber()}\n`

		const clientInfo = `👤 Клиент: ${selling.client.fullname}\n` + `📊 Общий долг: ${selling.client.debt.toNumber()}`

		caption = `🗑️ Продажа удалено\n\n${baseInfo}\n\n${clientInfo}`

		await this.bot.telegram.sendMessage(channelId, caption)
	}

	async sendSellingToChannel(selling: SellingFindOneData) {
		const channelId = this.configService.getOrThrow<string>('bot.sellingChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)
		if (!chatInfo) return

		const bufferPdf = await this.pdfService.generateInvoicePdfBuffer2(selling)

		let caption = ''
		const baseInfo = `🧾 Продажа\n\n` + `🆔 Заказ: ${selling.publicId}\n` + `💰 Сумма: ${selling.totalPrice.toNumber()}\n` + `💸 Долг: ${selling.debt.toNumber()}\n`

		const clientInfo = `👤 Клиент: ${selling.client.fullname}\n` + `📊 Общий долг: ${selling.client.debt.toNumber()}`

		let productInfo = ''

		const findProductByStatus = (status: BotSellingProductTitleEnum) => selling.products.find((prod) => prod.status === status)

		switch (selling.title) {
			case BotSellingTitleEnum.new:
				caption = `🧾 Новая продажа\n\n${baseInfo}\n${clientInfo}`
				break

			case BotSellingTitleEnum.added: {
				const newProduct = findProductByStatus(BotSellingProductTitleEnum.new)
				if (newProduct) {
					productInfo = `\n📦 Товар добавлен\n` + `• Название: ${newProduct.product.name}\n` + `• Цена: ${newProduct.price.toNumber()}\n` + `• Кол-во: ${newProduct.count}`
				}
				caption = `${baseInfo}${productInfo}\n\n${clientInfo}`
				break
			}

			case BotSellingTitleEnum.updated: {
				const updatedProduct = findProductByStatus(BotSellingProductTitleEnum.updated)
				if (updatedProduct) {
					productInfo =
						`\n♻️ Товар обновлён\n` + `• Название: ${updatedProduct.product.name}\n` + `• Цена: ${updatedProduct.price.toNumber()}\n` + `• Кол-во: ${updatedProduct.count}`
				}
				caption = `${baseInfo}${productInfo}\n\n${clientInfo}`
				break
			}

			case BotSellingTitleEnum.deleted: {
				const deletedProduct = findProductByStatus(BotSellingProductTitleEnum.deleted)
				if (deletedProduct) {
					productInfo =
						`\n🗑️ Товар удалён\n` + `• Название: ${deletedProduct.product.name}\n` + `• Цена: ${deletedProduct.price.toNumber()}\n` + `• Кол-во: ${deletedProduct.count}`
				}
				caption = `${baseInfo}${productInfo}\n\n${clientInfo}`
				break
			}

			default:
				caption = `${baseInfo}\n${clientInfo}`
				break
		}

		await this.bot.telegram.sendDocument(channelId, { source: bufferPdf, filename: `${selling.client.phone}.pdf` }, { caption })
	}

	async sendPaymentToChannel(payment: Partial<PaymentModel>, isModified: boolean = false, client: ClientFindOneData) {
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)

		if (!chatInfo) return

		const paymentType: Record<string, string> = {
			client: 'для клиента',
			selling: 'для продажи',
		}

		const totalPayment = payment.card.plus(payment.cash).plus(payment.other).plus(payment.transfer)

		const title =
			`${isModified ? '♻️ Обновлено\n\n' : ''}` +
			`📌 Тип: ${paymentType[payment.type] ?? 'неизвестно'}\n` +
			`👤 Клиент: ${client.fullname}\n` +
			`📞 Телефон: ${client.phone}\n` +
			`💰 Сумма: ${totalPayment.toNumber()}\n\n` +
			`💵 Наличными: ${payment.cash.toNumber()}\n` +
			`💳 Картой: ${payment.card.toNumber()}\n` +
			`🏦 Переводом: ${payment.transfer.toNumber()}\n` +
			`📦 Другое: ${payment.other.toNumber()}\n` +
			`📅 Дата: ${this.formatDate(payment.createdAt)}\n` +
			`📝 Описание: ${payment.description ?? '-'}\n` +
			`📊 Общий долг: ${client.debt.toNumber()}`

		await this.bot.telegram.sendMessage(channelId, title)
	}

	async sendDeletedPaymentToChannel(payment: Partial<PaymentModel>, client: ClientFindOneData) {
		const channelId = this.configService.getOrThrow<string>('bot.paymentChannelId')
		const chatInfo = await this.bot.telegram.getChat(channelId).catch(() => undefined)

		if (!chatInfo) return

		const paymentType: Record<string, string> = {
			client: 'для клиента',
			selling: 'для продажи',
		}

		const totalPayment = payment.card.plus(payment.cash).plus(payment.other).plus(payment.transfer)

		const title =
			`🗑️ Удалено\n\n` +
			`📌 Тип: ${paymentType[payment.type] ?? 'неизвестно'}\n` +
			`👤 Клиент: ${client.fullname}\n` +
			`📞 Телефон: ${client.phone}\n` +
			`💰 Сумма: ${totalPayment.toNumber()}\n\n` +
			`💵 Наличными: ${payment.cash.toNumber()}\n` +
			`💳 Картой: ${payment.card.toNumber()}\n` +
			`🏦 Переводом: ${payment.transfer.toNumber()}\n` +
			`📦 Другое: ${payment.other.toNumber()}\n` +
			`📅 Дата: ${this.formatDate(payment.createdAt)}\n` +
			`📝 Описание: ${payment.description ?? '-'}\n` +
			`📊 Общий долг: ${client.debt.toNumber()}`

		await this.bot.telegram.sendMessage(channelId, title)
	}

	private async findBotUserById(id: number | string) {
		const user = await this.prisma.botUserModel.findFirst({ where: { id: String(id) }, select: { id: true, language: true, isActive: true, userId: true, user: true } })
		return user
	}

	private async createBotUserWithId(id: number | string) {
		const user = await this.prisma.botUserModel.create({ data: { id: String(id) } })
		return user
	}

	private async updateBotUserWithId(id: number | string, body: { userId?: string; language?: BotLanguageEnum }) {
		const user = await this.prisma.botUserModel.update({ where: { id: String(id) }, data: { language: body.language, userId: body.userId } })
		return user
	}

	private async findUserByPhone(phone: string) {
		const cleanedPhone = phone.replace(/^\+/, '')
		const user = await this.prisma.userModel.findFirst({ where: { phone: cleanedPhone } })
		return user
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
