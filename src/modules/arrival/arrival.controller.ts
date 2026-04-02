import { Body, Controller, Delete, Get, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	ArrivalFindManyRequestDto,
	ArrivalFindOneRequestDto,
	ArrivalFindManyResponseDto,
	ArrivalFindOneResponseDto,
	ArrivalModifyResponseDto,
	ArrivalUpdateOneRequestDto,
	ArrivalDeleteOneRequestDto,
	ArrivalCreateOneRequestDto,
	ArrivalCreateOneResponseDto,
} from './dtos'
import { ArrivalService } from './arrival.service'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'
import { Response } from 'express'

@ApiTags('Arrival')
@Controller('arrival')
@UseGuards(CheckPermissionGuard)
export class ArrivalController {
	private readonly arrivalService: ArrivalService

	constructor(arrivalService: ArrivalService) {
		this.arrivalService = arrivalService
	}

	@Get('many')
	@ApiOkResponse({ type: ArrivalFindManyResponseDto })
	@ApiOperation({ summary: 'get all arrivals' })
	async findMany(@Query() query: ArrivalFindManyRequestDto): Promise<ArrivalFindManyResponseDto> {
		return this.arrivalService.findMany(query)
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'excel download many arrivals' })
	async excelDownloadMany(@Res() res: Response, @Query() query: ArrivalFindManyRequestDto) {
		return this.arrivalService.excelDownloadMany(res, query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one arrival' })
	@ApiOkResponse({ type: ArrivalFindOneResponseDto })
	async findOne(@Query() query: ArrivalFindOneRequestDto): Promise<ArrivalFindOneResponseDto> {
		return this.arrivalService.findOne(query)
	}

	@Get('excel-download/one')
	@ApiOperation({ summary: 'download many arrivals' })
	async excelDownloadOne(@Res() res: Response, @Query() query: ArrivalFindOneRequestDto) {
		return this.arrivalService.excelDownloadOne(res, query)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'create one arrival' })
	@ApiOkResponse({ type: ArrivalCreateOneResponseDto })
	async createOne(@Req() request: CRequest, @Body() body: ArrivalCreateOneRequestDto): Promise<ArrivalCreateOneResponseDto> {
		return this.arrivalService.createOne(request, body)
	}

	@Patch('one')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'update one arrival' })
	@ApiOkResponse({ type: ArrivalModifyResponseDto })
	async updateOne(@Query() query: ArrivalFindOneRequestDto, @Body() body: ArrivalUpdateOneRequestDto): Promise<ArrivalModifyResponseDto> {
		return this.arrivalService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one arrival' })
	@ApiOkResponse({ type: ArrivalModifyResponseDto })
	async deleteOne(@Query() query: ArrivalDeleteOneRequestDto): Promise<ArrivalModifyResponseDto> {
		return this.arrivalService.deleteOne(query)
	}
}
