import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared'
import { CurrencyController } from './currency.controller'
import { CurrencyService } from './currency.service'
import { CurrencyRepository } from './currency.repository'

@Module({
	imports: [PrismaModule],
	controllers: [CurrencyController],
	providers: [CurrencyService, CurrencyRepository],
	exports: [CurrencyService, CurrencyRepository],
})
export class CurrencyModule {}
