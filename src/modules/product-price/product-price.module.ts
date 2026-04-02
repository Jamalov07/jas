import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared'
import { ProductPriceController } from './product-price.controller'
import { ProductPriceService } from './product-price.service'
import { ProductPriceRepository } from './product-price.repository'

@Module({
	imports: [PrismaModule],
	controllers: [ProductPriceController],
	providers: [ProductPriceService, ProductPriceRepository],
	exports: [ProductPriceService, ProductPriceRepository],
})
export class ProductPriceModule {}
