import { forwardRef, Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { SupplierPaymentController } from './supplier-payment.controller'
import { SupplierPaymentService } from './supplier-payment.service'
import { SupplierPaymentRepository } from './supplier-payment.repository'
import { SupplierModule } from '../supplier'
import { BotModule } from '../bot'

@Module({
	imports: [PrismaModule, ExcelModule, forwardRef(() => SupplierModule), BotModule],
	controllers: [SupplierPaymentController],
	providers: [SupplierPaymentService, SupplierPaymentRepository],
	exports: [SupplierPaymentService, SupplierPaymentRepository],
})
export class SupplierPaymentModule {}
