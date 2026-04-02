import { forwardRef, Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { SupplierPaymentController } from './supplier-payment.controller'
import { SupplierPaymentService } from './supplier-payment.service'
import { SupplierPaymentRepository } from './supplier-payment.repository'
import { SupplierModule } from '../supplier'

@Module({
	imports: [PrismaModule, forwardRef(() => SupplierModule), ExcelModule],
	controllers: [SupplierPaymentController],
	providers: [SupplierPaymentService, SupplierPaymentRepository],
	exports: [SupplierPaymentService, SupplierPaymentRepository],
})
export class SupplierPaymentModule {}
