import { Body, Controller, Delete, Get, Patch, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	ClientFindManyRequestDto,
	ClientFindOneRequestDto,
	ClientFindManyResponseDto,
	ClientFindOneResponseDto,
	ClientModifyResponseDto,
	ClientUpdateOneRequestDto,
	ClientDeleteOneRequestDto,
	ClientCreateOneRequestDto,
	ClientCreateOneResponseDto,
} from './dtos'
import { ClientService } from './client.service'
import { Response } from 'express'
import { CheckPermissionGuard } from '../../common'

@ApiTags('Client')
@Controller('client')
@UseGuards(CheckPermissionGuard)
export class ClientController {
	private readonly clientService: ClientService

	constructor(clientService: ClientService) {
		this.clientService = clientService
	}

	@Get('many')
	@ApiOkResponse({ type: ClientFindManyResponseDto })
	@ApiOperation({ summary: 'get all clients' })
	async findMany(@Query() query: ClientFindManyRequestDto): Promise<ClientFindManyResponseDto> {
		return this.clientService.findMany(query)
	}

	@Get('many/report')
	@ApiOkResponse({ type: ClientFindManyResponseDto })
	@ApiOperation({ summary: 'get all client reports' })
	async findManyReport(@Query() query: ClientFindManyRequestDto): Promise<ClientFindManyResponseDto> {
		return this.clientService.findManyForReport(query)
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'download many clients' })
	async excelDownloadMany(@Res() res: Response, @Query() query: ClientFindManyRequestDto) {
		return this.clientService.excelDownloadMany(res, query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one client' })
	@ApiOkResponse({ type: ClientFindOneResponseDto })
	async findOne(@Query() query: ClientFindOneRequestDto): Promise<ClientFindOneResponseDto> {
		return this.clientService.findOne(query)
	}

	@Get('excel-download/one')
	@ApiOperation({ summary: 'download one client' })
	async excelDownloadOne(@Res() res: Response, @Query() query: ClientFindOneRequestDto) {
		return this.clientService.excelDownloadOne(res, query)
	}

	@Get('excel-with-product-download/one')
	@ApiOperation({ summary: 'download one client' })
	async excelWithProductDownloadOne(@Res() res: Response, @Query() query: ClientFindOneRequestDto) {
		return this.clientService.excelWithProductDownloadOne(res, query)
	}

	@Post('one')
	@ApiOperation({ summary: 'create one client' })
	@ApiOkResponse({ type: ClientCreateOneResponseDto })
	async createOne(@Body() body: ClientCreateOneRequestDto): Promise<ClientCreateOneResponseDto> {
		return this.clientService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one client' })
	@ApiOkResponse({ type: ClientModifyResponseDto })
	async updateOne(@Query() query: ClientFindOneRequestDto, @Body() body: ClientUpdateOneRequestDto): Promise<ClientModifyResponseDto> {
		return this.clientService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one client' })
	@ApiOkResponse({ type: ClientModifyResponseDto })
	async deleteOne(@Query() query: ClientDeleteOneRequestDto): Promise<ClientModifyResponseDto> {
		return this.clientService.deleteOne(query)
	}
}
