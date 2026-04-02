import { Body, Controller, Delete, Get, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	ClientPaymentFindManyRequestDto,
	ClientPaymentFindOneRequestDto,
	ClientPaymentFindManyResponseDto,
	ClientPaymentFindOneResponseDto,
	ClientPaymentModifyResponseDto,
	ClientPaymentUpdateOneRequestDto,
	ClientPaymentDeleteOneRequestDto,
	ClientPaymentCreateOneRequestDto,
	ClientPaymentCreateOneResponseDto,
} from './dtos'
import { ClientPaymentService } from './client-payment.service'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'
import { Response } from 'express'

@ApiTags('ClientPayment')
@Controller('client-payment')
@UseGuards(CheckPermissionGuard)
export class ClientPaymentController {
	private readonly clientPaymentService: ClientPaymentService

	constructor(clientPaymentService: ClientPaymentService) {
		this.clientPaymentService = clientPaymentService
	}

	@Get('many')
	@ApiOkResponse({ type: ClientPaymentFindManyResponseDto })
	@ApiOperation({ summary: 'get all clientPayments' })
	async findMany(@Query() query: ClientPaymentFindManyRequestDto): Promise<ClientPaymentFindManyResponseDto> {
		return this.clientPaymentService.findMany(query)
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'download many client payments' })
	async excelDownloadMany(@Res() res: Response, @Query() query: ClientPaymentFindManyRequestDto) {
		return this.clientPaymentService.excelDownloadMany(res, query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one clientPayment' })
	@ApiOkResponse({ type: ClientPaymentFindOneResponseDto })
	async findOne(@Query() query: ClientPaymentFindOneRequestDto): Promise<ClientPaymentFindOneResponseDto> {
		return this.clientPaymentService.findOne(query)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'create one clientPayment' })
	@ApiOkResponse({ type: ClientPaymentCreateOneResponseDto })
	async createOne(@Req() request: CRequest, @Body() body: ClientPaymentCreateOneRequestDto): Promise<ClientPaymentCreateOneResponseDto> {
		return this.clientPaymentService.createOne(request, body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one clientPayment' })
	@ApiOkResponse({ type: ClientPaymentModifyResponseDto })
	async updateOne(@Query() query: ClientPaymentFindOneRequestDto, @Body() body: ClientPaymentUpdateOneRequestDto): Promise<ClientPaymentModifyResponseDto> {
		return this.clientPaymentService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one clientPayment' })
	@ApiOkResponse({ type: ClientPaymentModifyResponseDto })
	async deleteOne(@Query() query: ClientPaymentDeleteOneRequestDto): Promise<ClientPaymentModifyResponseDto> {
		return this.clientPaymentService.deleteOne(query)
	}
}
