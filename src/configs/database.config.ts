import { registerAs } from '@nestjs/config'
import { DatabaseConfigOptions } from '@common'

export const databaseConfig = registerAs<DatabaseConfigOptions>('database', (): DatabaseConfigOptions => {
	return { url: process.env.DATABASE_URL }
})
