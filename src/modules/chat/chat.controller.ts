import { Body, Controller, Delete, Get, Post, Query, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'
import { ChatService } from './chat.service'
import {
	ChatCreateResponseDto,
	ChatCreateTextRequestDto,
	ChatDeleteOneRequestDto,
	ChatDeleteResponseDto,
	ChatFindManyRequestDto,
	ChatFindManyResponseDto,
	ChatSendFileRequestDto,
} from './dtos'

@ApiTags('Chat')
@Controller('chat')
@UseGuards(CheckPermissionGuard)
export class ChatController {
	constructor(private readonly chatService: ChatService) {}

	@Get('inbox')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'latest client conversations' })
	inbox() {
		return this.chatService.inbox()
	}

	@Get('many')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ChatFindManyResponseDto })
	@ApiOperation({ summary: 'client chat history' })
	findMany(@Query() query: ChatFindManyRequestDto) {
		return this.chatService.findMany(query)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ChatCreateResponseDto })
	@ApiOperation({ summary: 'send a text message to the client' })
	createOne(@Req() request: CRequest, @Body() body: ChatCreateTextRequestDto) {
		return this.chatService.createText(request.user.id, body)
	}

	@Post('file')
	@AuthOptions(true, true)
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			required: ['clientId', 'file'],
			properties: {
				clientId: { type: 'string' },
				text: { type: 'string' },
				file: { type: 'string', format: 'binary' },
			},
		},
	})
	@ApiOkResponse({ type: ChatCreateResponseDto })
	@ApiOperation({ summary: 'send a file to the client' })
	@UseInterceptors(FileInterceptor('file', { limits: { fileSize: 20 * 1024 * 1024 } }))
	createFile(@Req() request: CRequest, @UploadedFile() file: Express.Multer.File, @Body() body: ChatSendFileRequestDto) {
		return this.chatService.createFile(request.user.id, body, file)
	}

	@Delete('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ChatDeleteResponseDto })
	@ApiOperation({ summary: 'delete a chat message' })
	deleteOne(@Query() query: ChatDeleteOneRequestDto) {
		return this.chatService.deleteOne(query.id)
	}
}
