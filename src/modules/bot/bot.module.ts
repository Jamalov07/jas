import { Module } from '@nestjs/common'
import { MyBotName } from './constants'
import { TelegrafModule } from 'nestjs-telegraf'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BotService } from './bot.service'
import { BotUpdate } from './bot.update'
import { PdfModule, PrismaModule } from '../shared'

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		TelegrafModule.forRootAsync({
			botName: MyBotName,
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const token = configService.get<string>('bot.token')
				return {
					token,
					middlewares: [],
					include: [],
				}
			},
		}),
		PrismaModule,
		PdfModule,
	],
	providers: [BotUpdate, BotService],
	exports: [BotService],
})
export class BotModule {}
