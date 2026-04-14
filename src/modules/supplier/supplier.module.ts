import { Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { SupplierController } from './supplier.controller'
import { SupplierService } from './supplier.service'
import { SupplierRepository } from './supplier.repository'
import { CurrencyModule } from '../currency'

@Module({
	imports: [PrismaModule, ExcelModule, CurrencyModule],
	controllers: [SupplierController],
	providers: [SupplierService, SupplierRepository],
	exports: [SupplierService, SupplierRepository],
})
export class SupplierModule {}
