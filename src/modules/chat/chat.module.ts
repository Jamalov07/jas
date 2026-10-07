import { Module } from '@nestjs/common'
import { PrismaModule } from '../shared/prisma'
import { ChatController } from './chat.controller'
import { ChatGateway } from './chat.gateway'
import { ChatRecorder } from './chat.recorder'
import { ChatRepository } from './chat.repository'
import { ChatService } from './chat.service'

@Module({
	imports: [PrismaModule],
	controllers: [ChatController],
	providers: [ChatService, ChatRepository, ChatRecorder, ChatGateway],
	exports: [ChatRecorder, ChatService],
})
export class ChatModule {}
