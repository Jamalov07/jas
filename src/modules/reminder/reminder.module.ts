import { Module } from '@nestjs/common'
import { ChatModule } from '../chat/chat.module'
import { PrismaModule } from '../shared/prisma'
import { ReminderController } from './reminder.controller'
import { ReminderRepository } from './reminder.repository'
import { ReminderService } from './reminder.service'

@Module({
	imports: [PrismaModule, ChatModule],
	controllers: [ReminderController],
	providers: [ReminderService, ReminderRepository],
	exports: [ReminderService],
})
export class ReminderModule {}
