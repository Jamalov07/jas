import { Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { SellingController } from './selling.controller'
import { SellingService } from './selling.service'
import { SellingRepository } from './selling.repository'
import { CommonModule } from '../common'
import { BotModule } from '../bot'
import { ClientModule } from '../client'
import { CurrencyModule } from '../currency'

@Module({
	imports: [PrismaModule, CommonModule, ExcelModule, BotModule, ClientModule, CurrencyModule],
	controllers: [SellingController],
	providers: [SellingService, SellingRepository],
	exports: [SellingService, SellingRepository],
})
export class SellingModule {}
