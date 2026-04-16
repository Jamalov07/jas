import { Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { CurrencyModule } from '../currency/currency.module'
import { ProductController } from './product.controller'
import { ProductService } from './product.service'
import { ProductRepository } from './product.repository'

@Module({
	imports: [PrismaModule, ExcelModule, CurrencyModule],
	controllers: [ProductController],
	providers: [ProductService, ProductRepository],
	exports: [ProductService, ProductRepository],
})
export class ProductModule {}
