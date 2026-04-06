import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared/prisma'
import { ArrivalProductMVController } from './arrival-product-mv.controller'
import { ArrivalProductMVService } from './arrival-product-mv.service'
import { ArrivalProductMVRepository } from './arrival-product-mv.repository'

@Module({
	imports: [PrismaModule],
	controllers: [ArrivalProductMVController],
	providers: [ArrivalProductMVService, ArrivalProductMVRepository],
	exports: [ArrivalProductMVService, ArrivalProductMVRepository],
})
export class ArrivalProductMVModule {}
