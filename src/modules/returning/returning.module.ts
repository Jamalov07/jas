import { Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { ReturningController } from './returning.controller'
import { ReturningService } from './returning.service'
import { ReturningRepository } from './returning.repository'
import { CommonModule } from '../common'
import { CurrencyModule } from '../currency'
import { ClientModule } from '../client'

@Module({
	imports: [PrismaModule, CommonModule, ExcelModule, CurrencyModule, ClientModule],
	controllers: [ReturningController],
	providers: [ReturningService, ReturningRepository],
	exports: [ReturningService, ReturningRepository],
})
export class ReturningModule {}
