import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared/prisma'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'
import { StatisticsRepository } from './statistics.repository'
import { CurrencyModule } from '../currency'

@Module({
	imports: [PrismaModule, CurrencyModule],
	controllers: [StatisticsController],
	providers: [StatisticsService, StatisticsRepository],
	exports: [StatisticsService, StatisticsRepository],
})
export class StatisticsModule {}
