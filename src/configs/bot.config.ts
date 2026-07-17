import { registerAs } from '@nestjs/config'
import { BotConfigOptions } from '@common'

const envOrUndefined = (value: string | undefined): string | undefined => {
	const trimmed = value?.trim()
	return trimmed || undefined
}

export const botConfig = registerAs('bot', (): BotConfigOptions => {
	return {
		token: envOrUndefined(process.env.BOT_TOKEN),
		paymentChannelId: envOrUndefined(process.env.PAYMENT_CHANNEL_ID),
		sellingChannelId: envOrUndefined(process.env.SELLING_CHANNEL_ID),
	}
})
