import { Body, Controller, Delete, Get, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	ReturningFindManyRequestDto,
	ReturningFindOneRequestDto,
	ReturningFindManyResponseDto,
	ReturningFindOneResponseDto,
	ReturningModifyResponseDto,
	ReturningUpdateOneRequestDto,
	ReturningDeleteOneRequestDto,
	ReturningCreateOneRequestDto,
	ReturningCreateOneResponseDto,
} from './dtos'
import { ReturningService } from './returning.service'
import { CheckPermissionGuard, CRequest } from '../../common'
import { Response } from 'express'

@ApiTags('Returning')
@Controller('returning')
@UseGuards(CheckPermissionGuard)
export class ReturningController {
	constructor(private readonly returningService: ReturningService) {}

	@Get('many')
	@ApiOkResponse({ type: ReturningFindManyResponseDto })
	@ApiOperation({ summary: 'get all returnings' })
	async findMany(@Query() query: ReturningFindManyRequestDto): Promise<ReturningFindManyResponseDto> {
		return this.returningService.findMany({ ...query, isDeleted: false })
	}

	@Get('one')
	@ApiOperation({ summary: 'find one returning' })
	@ApiOkResponse({ type: ReturningFindOneResponseDto })
	async findOne(@Query() query: ReturningFindOneRequestDto): Promise<ReturningFindOneResponseDto> {
		return this.returningService.findOne(query)
	}

	@Post('one')
	@ApiOperation({ summary: 'create one returning' })
	@ApiOkResponse({ type: ReturningCreateOneResponseDto })
	async createOne(@Req() request: CRequest, @Body() body: ReturningCreateOneRequestDto): Promise<ReturningCreateOneResponseDto> {
		return this.returningService.createOne(request, body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one returning' })
	@ApiOkResponse({ type: ReturningModifyResponseDto })
	async updateOne(@Query() query: ReturningFindOneRequestDto, @Body() body: ReturningUpdateOneRequestDto): Promise<ReturningModifyResponseDto> {
		return this.returningService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one returning' })
	@ApiOkResponse({ type: ReturningModifyResponseDto })
	async deleteOne(@Query() query: ReturningDeleteOneRequestDto): Promise<ReturningModifyResponseDto> {
		return this.returningService.deleteOne(query)
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'download many returnings as excel' })
	async excelDownloadMany(@Res() res: Response, @Query() query: ReturningFindManyRequestDto) {
		return this.returningService.excelDownloadMany(res, query)
	}

	@Get('excel-download/one')
	@ApiOperation({ summary: 'download one returning as excel' })
	async excelDownloadOne(@Res() res: Response, @Query() query: ReturningFindOneRequestDto) {
		return this.returningService.excelDownloadOne(res, query)
	}
}
