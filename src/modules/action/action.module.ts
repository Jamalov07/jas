import { Module } from '@nestjs/common'
import { ActionController } from './action.controller'
import { ActionService } from './action.service'
import { ActionRepository } from './action.repository'
import { PrismaModule } from '../shared'

@Module({
	imports: [PrismaModule],
	controllers: [ActionController],
	providers: [ActionService, ActionRepository],
	exports: [],
})
export class ActionModule {}
