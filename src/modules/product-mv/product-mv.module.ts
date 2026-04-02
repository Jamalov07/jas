import { forwardRef, Module } from '@nestjs/common'
import { PrismaModule } from '../shared'
import { ProductMVController } from './product-mv.controller'
import { ProductMVService } from './product-mv.service'
import { ProductMVRepository } from './product-mv.repository'
import { BotModule } from '../bot'
import { ClientModule } from '../client'
import { SellingModule } from '../selling'
import { ArrivalModule } from '../arrival'
import { ReturningModule } from '../returning'

@Module({
	imports: [PrismaModule, BotModule, ClientModule, forwardRef(() => SellingModule), forwardRef(() => ArrivalModule), forwardRef(() => ReturningModule)],
	controllers: [ProductMVController],
	providers: [ProductMVService, ProductMVRepository],
	exports: [ProductMVService, ProductMVRepository],
})
export class ProductMVModule {}
