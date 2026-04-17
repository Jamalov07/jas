import { Body, Controller, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { CommonService } from './common.service'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'
import {
	DayCloseGetOneRequestDto,
	DayCloseGetOneResponseDto,
	DayCloseModifyResponseDto,
	StaffUpdateCurrencyRequestDto,
	StaffUpdateCurrencyResponseDto,
} from './dtos'

@Controller('common')
@ApiTags('Common')
@UseGuards(CheckPermissionGuard)
export class CommonController {
	private readonly commonService: CommonService
	constructor(commonService: CommonService) {
		this.commonService = commonService
	}

	@Post('day-close')
	@ApiOkResponse({ type: DayCloseModifyResponseDto })
	@ApiOperation({ summary: 'create close day' })
	@AuthOptions(false, false)
	async createDayClose(): Promise<DayCloseModifyResponseDto> {
		return this.commonService.createDayClose()
	}

	@Get('day-close')
	@ApiOkResponse({ type: DayCloseGetOneResponseDto })
	@ApiOperation({ summary: 'get close day' })
	@AuthOptions(false, false)
	async getDayClose(@Query() query: DayCloseGetOneRequestDto): Promise<DayCloseGetOneResponseDto> {
		return this.commonService.getDayClose(query)
	}

	@Patch('staff/currency')
	@ApiOkResponse({ type: StaffUpdateCurrencyResponseDto })
	@ApiOperation({ summary: 'update current staff default reporting currency' })
	@AuthOptions(true, true)
	async updateStaffCurrency(@Req() request: CRequest, @Body() body: StaffUpdateCurrencyRequestDto): Promise<StaffUpdateCurrencyResponseDto> {
		return this.commonService.updateStaffCurrency(request.user!.id, body)
	}
}
