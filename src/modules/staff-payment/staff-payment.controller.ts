import { Body, Controller, Delete, Get, Patch, Post, Query, Req, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	StaffPaymentFindManyRequestDto,
	StaffPaymentFindOneRequestDto,
	StaffPaymentFindManyResponseDto,
	StaffPaymentFindOneResponseDto,
	StaffPaymentModifyResponseDto,
	StaffPaymentUpdateOneRequestDto,
	StaffPaymentDeleteOneRequestDto,
	StaffPaymentCreateOneRequestDto,
	StaffPaymentCreateOneResponseDto,
} from './dtos'
import { StaffPaymentService } from './staff-payment.service'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'
import { Response } from 'express'

@ApiTags('Staff Payment')
@Controller('staff-payment')
@UseGuards(CheckPermissionGuard)
export class StaffPaymentController {
	private readonly staffPaymentService: StaffPaymentService

	constructor(staffPaymentService: StaffPaymentService) {
		this.staffPaymentService = staffPaymentService
	}

	@Get('many')
	@ApiOkResponse({ type: StaffPaymentFindManyResponseDto })
	@ApiOperation({ summary: 'get all staffPayments' })
	async findMany(@Query() query: StaffPaymentFindManyRequestDto): Promise<StaffPaymentFindManyResponseDto> {
		return this.staffPaymentService.findMany({ ...query, isDeleted: false })
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'download many supplier payments' })
	async excelDownloadMany(@Res() res: Response, @Query() query: StaffPaymentFindManyRequestDto) {
		return this.staffPaymentService.excelDownloadMany(res, query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one staffPayment' })
	@ApiOkResponse({ type: StaffPaymentFindOneResponseDto })
	async findOne(@Query() query: StaffPaymentFindOneRequestDto): Promise<StaffPaymentFindOneResponseDto> {
		return this.staffPaymentService.findOne(query)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'create one staffPayment' })
	@ApiOkResponse({ type: StaffPaymentCreateOneResponseDto })
	async createOne(@Req() request: CRequest, @Body() body: StaffPaymentCreateOneRequestDto): Promise<StaffPaymentCreateOneResponseDto> {
		return this.staffPaymentService.createOne(request, body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one staffPayment' })
	@ApiOkResponse({ type: StaffPaymentModifyResponseDto })
	async updateOne(@Query() query: StaffPaymentFindOneRequestDto, @Body() body: StaffPaymentUpdateOneRequestDto): Promise<StaffPaymentModifyResponseDto> {
		return this.staffPaymentService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one staffPayment' })
	@ApiOkResponse({ type: StaffPaymentModifyResponseDto })
	async deleteOne(@Query() query: StaffPaymentDeleteOneRequestDto): Promise<StaffPaymentModifyResponseDto> {
		return this.staffPaymentService.deleteOne(query)
	}
}
