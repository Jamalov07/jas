import { Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { ArrivalController } from './arrival.controller'
import { ArrivalService } from './arrival.service'
import { ArrivalRepository } from './arrival.repository'
import { CurrencyModule } from '../currency'
import { SupplierModule } from '../supplier'

@Module({
	imports: [PrismaModule, ExcelModule, CurrencyModule, SupplierModule],
	controllers: [ArrivalController],
	providers: [ArrivalService, ArrivalRepository],
	exports: [ArrivalService, ArrivalRepository],
})
export class ArrivalModule {}
