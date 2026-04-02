import { registerAs } from '@nestjs/config'
import { AppConfigOptions } from '@common'

export const appConfig = registerAs('app', (): AppConfigOptions => {
	return {
		host: process.env.APP_HOST ?? '127.0.0.1',
		port: process.env.APP_PORT ? parseInt(process.env.APP_PORT) : 5000,
	}
})
