import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared/prisma'
import { ReturningProductMVController } from './returning-product-mv.controller'
import { ReturningProductMVService } from './returning-product-mv.service'
import { ReturningProductMVRepository } from './returning-product-mv.repository'

@Module({
	imports: [PrismaModule],
	controllers: [ReturningProductMVController],
	providers: [ReturningProductMVService, ReturningProductMVRepository],
	exports: [ReturningProductMVService, ReturningProductMVRepository],
})
export class ReturningProductMVModule {}
