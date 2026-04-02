import { forwardRef, Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { ClientPaymentController } from './client-payment.controller'
import { ClientPaymentService } from './client-payment.service'
import { ClientPaymentRepository } from './client-payment.repository'
import { ClientModule } from '../client'
import { BotModule } from '../bot'

@Module({
	imports: [PrismaModule, forwardRef(() => ClientModule), ExcelModule, BotModule],
	controllers: [ClientPaymentController],
	providers: [ClientPaymentService, ClientPaymentRepository],
	exports: [ClientPaymentService, ClientPaymentRepository],
})
export class ClientPaymentModule {}
