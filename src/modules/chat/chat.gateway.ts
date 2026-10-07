import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { ConnectedSocket, MessageBody, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import { IsNotEmpty, IsUUID } from 'class-validator'
import { Server, Socket } from 'socket.io'
import { PrismaService } from '../shared/prisma'
import { ChatMessageView } from './chat.types'

class JoinChatDto {
	@IsUUID('4')
	@IsNotEmpty()
	clientId: string
}

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
@Injectable()
export class ChatGateway implements OnGatewayInit {
	@WebSocketServer()
	server: Server

	constructor(
		private readonly jwt: JwtService,
		private readonly config: ConfigService,
		private readonly prisma: PrismaService,
	) {}

	afterInit(server: Server) {
		server.use((socket, next) => {
			this.authenticate(socket)
				.then(() => next())
				.catch((error) => next(error instanceof Error ? error : new Error('unauthorized')))
		})
	}

	@SubscribeMessage('join')
	join(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinChatDto) {
		if (!client.data.staffId || !payload?.clientId) return { ok: false }
		client.join(this.room(payload.clientId))
		return { ok: true }
	}

	emitMessage(clientId: string, message: ChatMessageView) {
		this.server?.to(this.room(clientId)).emit('message', message)
	}

	emitDeleted(clientId: string, id: string) {
		this.server?.to(this.room(clientId)).emit('message-deleted', { id })
	}

	private async authenticate(client: Socket) {
		const token = String(client.handshake.auth?.token || client.handshake.query?.token || '')
		if (!token) throw new Error('unauthorized')
		const payload = await this.jwt.verifyAsync<{ id?: string }>(token, { secret: this.config.get('jwt.accessToken.key') })
		if (!payload?.id) throw new Error('unauthorized')
		const staff = await this.prisma.staffModel.findFirst({ where: { id: payload.id, isActive: true } })
		if (!staff) throw new Error('unauthorized')
		client.data.staffId = staff.id
	}

	private room(clientId: string) {
		return `client:${clientId}`
	}
}
