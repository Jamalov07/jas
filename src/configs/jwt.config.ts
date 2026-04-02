import { JwtConfigOptions } from '@common'
import { registerAs } from '@nestjs/config'

export const jwtConfig = registerAs(
	'jwt',
	(): JwtConfigOptions => ({
		accessToken: {
			key: process.env.ACCESS_TOKEN_KEY ?? 'qpwoeiruty',
			time: process.env.ACCESS_TOKEN_TIME ?? '1y',
		},
		refreshToken: {
			key: process.env.REFRESH_TOKEN_KEY ?? 'zmakqoxnsjwo',
			time: process.env.REFRESH_TOKEN_TIME ?? '1y',
		},
	}),
)
