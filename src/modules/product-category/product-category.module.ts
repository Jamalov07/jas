import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared'
import { ProductCategoryController } from './product-category.controller'
import { ProductCategoryService } from './product-category.service'
import { ProductCategoryRepository } from './product-category.repository'

@Module({
	imports: [PrismaModule],
	controllers: [ProductCategoryController],
	providers: [ProductCategoryService, ProductCategoryRepository],
	exports: [ProductCategoryService, ProductCategoryRepository],
})
export class ProductCategoryModule {}
