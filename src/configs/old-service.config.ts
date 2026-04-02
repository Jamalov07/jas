import { registerAs } from '@nestjs/config'
import { OldServiceConfigOptions } from '@common'

export const oldServiceConfig = registerAs('old-service', (): OldServiceConfigOptions => {
	return {
		baseUrl: process.env.OLD_SERVICE_BASE_URL,
		user: process.env.OLD_SERVICE_USER,
		password: process.env.OLD_SERVICE_PASS,
	}
})
