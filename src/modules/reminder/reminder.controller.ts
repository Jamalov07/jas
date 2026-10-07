import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthOptions, CheckPermissionGuard } from '../../common'
import {
	ReminderCreateOneRequestDto,
	ReminderFindManyRequestDto,
	ReminderFindManyResponseDto,
	ReminderFindOneRequestDto,
	ReminderFindOneResponseDto,
	ReminderModifyResponseDto,
	ReminderUpdateOneRequestDto,
} from './dtos'
import { ReminderService } from './reminder.service'

@ApiTags('Reminder')
@Controller('reminder')
@UseGuards(CheckPermissionGuard)
export class ReminderController {
	constructor(private readonly reminderService: ReminderService) {}

	@Get('many')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ReminderFindManyResponseDto })
	@ApiOperation({ summary: 'list reminders' })
	findMany(@Query() query: ReminderFindManyRequestDto) {
		return this.reminderService.findMany(query)
	}

	@Get('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ReminderFindOneResponseDto })
	@ApiOperation({ summary: 'find one reminder' })
	findOne(@Query() query: ReminderFindOneRequestDto) {
		return this.reminderService.findOne(query.id)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ReminderFindOneResponseDto })
	@ApiOperation({ summary: 'create one reminder' })
	createOne(@Body() body: ReminderCreateOneRequestDto) {
		return this.reminderService.createOne(body)
	}

	@Patch('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ReminderFindOneResponseDto })
	@ApiOperation({ summary: 'update one reminder' })
	updateOne(@Query() query: ReminderFindOneRequestDto, @Body() body: ReminderUpdateOneRequestDto) {
		return this.reminderService.updateOne(query.id, body)
	}

	@Delete('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ReminderModifyResponseDto })
	@ApiOperation({ summary: 'stop and delete one reminder' })
	deleteOne(@Query() query: ReminderFindOneRequestDto) {
		return this.reminderService.deleteOne(query.id)
	}
}
