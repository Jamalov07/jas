import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { StaffService } from './staff.service'
import {
	StaffFindManyRequestDto,
	StaffFindOneRequestDto,
	StaffFindManyResponseDto,
	StaffFindOneResponseDto,
	StaffModifyResponseDto,
	StaffUpdateOneRequestDto,
	StaffDeleteOneRequestDto,
	StaffCreateOneRequestDto,
	StaffCreateOneResponseDto,
} from './dtos'
import { CheckPermissionGuard } from '../../common'

@ApiTags('Staff')
@Controller('staff')
@UseGuards(CheckPermissionGuard)
export class StaffController {
	private readonly staffService: StaffService

	constructor(staffService: StaffService) {
		this.staffService = staffService
	}

	@Get('many')
	@ApiOkResponse({ type: StaffFindManyResponseDto })
	@ApiOperation({ summary: 'get all staffs' })
	async findMany(@Query() query: StaffFindManyRequestDto): Promise<StaffFindManyResponseDto> {
		return this.staffService.findMany({ ...query, isDeleted: false })
	}

	@Get('one')
	@ApiOperation({ summary: 'find one staff' })
	@ApiOkResponse({ type: StaffFindOneResponseDto })
	async findOne(@Query() query: StaffFindOneRequestDto): Promise<StaffFindOneResponseDto> {
		return this.staffService.findOne(query)
	}

	@Post('one')
	@ApiOperation({ summary: 'create one staff' })
	@ApiOkResponse({ type: StaffCreateOneResponseDto })
	async createOne(@Body() body: StaffCreateOneRequestDto): Promise<StaffCreateOneResponseDto> {
		return this.staffService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one staff' })
	@ApiOkResponse({ type: StaffModifyResponseDto })
	async updateOne(@Query() query: StaffFindOneRequestDto, @Body() body: StaffUpdateOneRequestDto): Promise<StaffModifyResponseDto> {
		return this.staffService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one staff' })
	@ApiOkResponse({ type: StaffModifyResponseDto })
	async deleteOne(@Query() query: StaffDeleteOneRequestDto): Promise<StaffModifyResponseDto> {
		return this.staffService.deleteOne(query)
	}
}
