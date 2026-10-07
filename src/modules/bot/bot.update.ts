import { Injectable } from '@nestjs/common'
import { BotService } from './bot.service'
import { Ctx, Hears, On, Start, Update } from 'nestjs-telegraf'
import { Context } from 'telegraf'
import { BotLanguageEnum } from '@prisma/client'

const LANGUAGE_BUTTONS = new Set(["O'zbek tili", 'Русскый язык', 'English language'])

@Update()
@Injectable()
export class BotUpdate {
	private readonly botService: BotService
	constructor(botService: BotService) {
		this.botService = botService
	}

	@Start()
	async onStart(@Ctx() ctx: Context) {
		return this.botService.onStart(ctx)
	}

	@Hears("O'zbek tili")
	async onSelectUzbek(@Ctx() ctx: Context) {
		return await this.botService.onSelectLanguage(ctx, BotLanguageEnum.uz)
	}

	@Hears('Русскый язык')
	async onSelectRussian(@Ctx() ctx: Context) {
		return await this.botService.onSelectLanguage(ctx, BotLanguageEnum.ru)
	}

	@Hears('English language')
	async onSelectEnglish(@Ctx() ctx: Context) {
		return await this.botService.onSelectLanguage(ctx, BotLanguageEnum.en)
	}

	@On('contact')
	async onContact(@Ctx() ctx: Context) {
		return await this.botService.onContact(ctx)
	}

	@On('text')
	async onText(@Ctx() ctx: Context) {
		const text = ctx.message && 'text' in ctx.message ? ctx.message.text : ''
		if (!text || text.startsWith('/') || LANGUAGE_BUTTONS.has(text)) return
		return this.botService.onIncomingText(ctx)
	}

	@On('photo')
	async onPhoto(@Ctx() ctx: Context) {
		return this.botService.onIncomingPhoto(ctx)
	}

	@On('document')
	async onDocument(@Ctx() ctx: Context) {
		return this.botService.onIncomingDocument(ctx)
	}
}
