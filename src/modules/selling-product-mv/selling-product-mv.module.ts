import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared/prisma'
import { SellingProductMVController } from './selling-product-mv.controller'
import { SellingProductMVService } from './selling-product-mv.service'
import { SellingProductMVRepository } from './selling-product-mv.repository'

@Module({
	imports: [PrismaModule],
	controllers: [SellingProductMVController],
	providers: [SellingProductMVService, SellingProductMVRepository],
	exports: [SellingProductMVService, SellingProductMVRepository],
})
export class SellingProductMVModule {}
