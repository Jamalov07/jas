import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	ReturningProductMVFindManyRequestDto,
	ReturningProductMVFindOneRequestDto,
	ReturningProductMVCreateOneRequestDto,
	ReturningProductMVUpdateOneRequestDto,
	ReturningProductMVDeleteOneRequestDto,
	ReturningProductMVFindManyResponseDto,
	ReturningProductMVFindOneResponseDto,
	ReturningProductMVModifyResponseDto,
} from './dtos'
import { ReturningProductMVService } from './returning-product-mv.service'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'

@ApiTags('Returning Product MV')
@Controller('returning-product-mv')
@UseGuards(CheckPermissionGuard)
export class ReturningProductMVController {
	constructor(private readonly returningProductMVService: ReturningProductMVService) {}

	@Get('many')
	@ApiOkResponse({ type: ReturningProductMVFindManyResponseDto })
	@ApiOperation({ summary: 'get many returning product movements' })
	async findMany(@Query() query: ReturningProductMVFindManyRequestDto): Promise<ReturningProductMVFindManyResponseDto> {
		return this.returningProductMVService.findMany(query)
	}

	@Get('one')
	@ApiOkResponse({ type: ReturningProductMVFindOneResponseDto })
	@ApiOperation({ summary: 'get one returning product movement' })
	async findOne(@Query() query: ReturningProductMVFindOneRequestDto): Promise<ReturningProductMVFindOneResponseDto> {
		return this.returningProductMVService.findOne(query)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ReturningProductMVModifyResponseDto })
	@ApiOperation({ summary: 'create one returning product movement' })
	async createOne(@Req() request: CRequest, @Body() body: ReturningProductMVCreateOneRequestDto): Promise<ReturningProductMVModifyResponseDto> {
		return this.returningProductMVService.createOne(request, body)
	}

	@Patch('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ReturningProductMVModifyResponseDto })
	@ApiOperation({ summary: 'update one returning product movement' })
	async updateOne(
		@Req() request: CRequest,
		@Query() query: ReturningProductMVFindOneRequestDto,
		@Body() body: ReturningProductMVUpdateOneRequestDto,
	): Promise<ReturningProductMVModifyResponseDto> {
		return this.returningProductMVService.updateOne(request, query, body)
	}

	@Delete('one')
	@ApiOkResponse({ type: ReturningProductMVModifyResponseDto })
	@ApiOperation({ summary: 'delete one returning product movement' })
	async deleteOne(@Query() query: ReturningProductMVDeleteOneRequestDto): Promise<ReturningProductMVModifyResponseDto> {
		return this.returningProductMVService.deleteOne(query)
	}
}
