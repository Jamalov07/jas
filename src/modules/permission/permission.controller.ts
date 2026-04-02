import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { PermissionService } from './permission.service'
import { AuthOptions, CheckPermissionGuard } from '@common'
import {
	PermissionFindManyRequestDto,
	PermissionCreateOneRequestDto,
	PermissionUpdateOneRequestDto,
	PermissionFindOneRequestDto,
	PermissionFindManyResponseDto,
	PermissionFindOneResponseDto,
	PermissionModifyResponseDto,
} from './dtos'

@ApiTags('Permission')
@Controller('permission')
@UseGuards(CheckPermissionGuard)
export class PermissionController {
	private readonly permissionService: PermissionService

	constructor(permissionService: PermissionService) {
		this.permissionService = permissionService
	}

	@Get('many')
	@ApiOkResponse({ type: PermissionFindManyResponseDto })
	@ApiOperation({ summary: 'get all permissions' })
	@AuthOptions(false, false)
	async findMany(@Query() query: PermissionFindManyRequestDto): Promise<PermissionFindManyResponseDto> {
		return this.permissionService.findMany(query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one permission' })
	@ApiOkResponse({ type: PermissionFindOneResponseDto })
	async getOne(@Query() query: PermissionFindOneRequestDto): Promise<PermissionFindOneResponseDto> {
		return this.permissionService.findOne(query)
	}

	@Post('one')
	@ApiOperation({ summary: 'add one permission' })
	@ApiOkResponse({ type: PermissionModifyResponseDto })
	async createOne(@Body() body: PermissionCreateOneRequestDto): Promise<PermissionModifyResponseDto> {
		return this.permissionService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one permission' })
	@ApiOkResponse({ type: PermissionModifyResponseDto })
	async updateOne(@Query() query: PermissionFindOneRequestDto, @Body() body: PermissionUpdateOneRequestDto): Promise<PermissionModifyResponseDto> {
		return this.permissionService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'update one permission' })
	@ApiOkResponse({ type: PermissionModifyResponseDto })
	async deleteOne(@Query() query: PermissionFindOneRequestDto): Promise<PermissionModifyResponseDto> {
		return this.permissionService.deleteOne(query)
	}
}
