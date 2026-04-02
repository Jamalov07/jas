import { forwardRef, Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { ArrivalController } from './arrival.controller'
import { ArrivalService } from './arrival.service'
import { ArrivalRepository } from './arrival.repository'
import { SupplierModule } from '../supplier'

@Module({
	imports: [PrismaModule, ExcelModule, forwardRef(() => SupplierModule)],
	controllers: [ArrivalController],
	providers: [ArrivalService, ArrivalRepository],
	exports: [ArrivalService, ArrivalRepository],
})
export class ArrivalModule {}
