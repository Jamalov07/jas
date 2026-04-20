import { registerAs } from '@nestjs/config'
import { AppConfigOptions } from '@common'

export const appConfig = registerAs('app', (): AppConfigOptions => {
	const portEnv = process.env.APP_PORT ?? process.env.PORT
	const parsed = portEnv ? parseInt(portEnv, 10) : NaN
	return {
		host: process.env.APP_HOST ?? process.env.HOST ?? '127.0.0.1',
		port: Number.isFinite(parsed) ? parsed : 5000,
	}
})
