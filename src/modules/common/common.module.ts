import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared'
import { CommonController } from './common.controller'
import { CommonService } from './common.service'
import { CommonRepository } from './common.repository'

@Module({
	imports: [PrismaModule],
	controllers: [CommonController],
	providers: [CommonService, CommonRepository],
	exports: [CommonService, CommonRepository],
})
export class CommonModule {}
