import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared/prisma'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { StatisticsRepository } from './statistics.repository'
import { CurrencyModule } from '../currency'
import { ClientModule } from '../client'
import { SupplierModule } from '../supplier'

@Module({
	imports: [PrismaModule, CurrencyModule, ClientModule, SupplierModule],
	controllers: [StatisticsController],
	providers: [StatisticsService, StatisticsRepository],
	exports: [StatisticsService, StatisticsRepository],
})
export class StatisticsModule {}
