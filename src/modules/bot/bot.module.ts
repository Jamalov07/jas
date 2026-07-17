import { DynamicModule, Module } from '@nestjs/common'
import { MyBotName } from './constants'
import { TelegrafModule } from 'nestjs-telegraf'
import { ConfigService } from '@nestjs/config'
import { BotService } from './bot.service'
import { BotUpdate } from './bot.update'
import { PdfModule, PrismaModule } from '../shared'

const isBotConfigured = (): boolean => !!process.env.BOT_TOKEN?.trim()

@Module({})
export class BotModule {
	static forRoot(): DynamicModule {
		const imports: DynamicModule['imports'] = [PrismaModule, PdfModule]
		const providers: DynamicModule['providers'] = [BotService]

		if (isBotConfigured()) {
			imports.push(
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
			)
			providers.push(BotUpdate)
		}

		return {
			module: BotModule,
			global: true,
			imports,
			providers,
			exports: [BotService],
		}
	}
}
