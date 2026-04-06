import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	SellingProductMVFindManyRequestDto,
	SellingProductMVFindOneRequestDto,
	SellingProductMVCreateOneRequestDto,
	SellingProductMVUpdateOneRequestDto,
	SellingProductMVDeleteOneRequestDto,
	SellingProductMVFindManyResponseDto,
	SellingProductMVFindOneResponseDto,
	SellingProductMVModifyResponseDto,
} from './dtos'
import { SellingProductMVService } from './selling-product-mv.service'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'

@ApiTags('Selling Product MV')
@Controller('selling-product-mv')
@UseGuards(CheckPermissionGuard)
export class SellingProductMVController {
	constructor(private readonly sellingProductMVService: SellingProductMVService) {}

	@Get('many')
	@ApiOkResponse({ type: SellingProductMVFindManyResponseDto })
	@ApiOperation({ summary: 'get many selling product movements' })
	async findMany(@Query() query: SellingProductMVFindManyRequestDto): Promise<SellingProductMVFindManyResponseDto> {
		return this.sellingProductMVService.findMany(query)
	}

	@Get('one')
	@ApiOkResponse({ type: SellingProductMVFindOneResponseDto })
	@ApiOperation({ summary: 'get one selling product movement' })
	async findOne(@Query() query: SellingProductMVFindOneRequestDto): Promise<SellingProductMVFindOneResponseDto> {
		return this.sellingProductMVService.findOne(query)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: SellingProductMVModifyResponseDto })
	@ApiOperation({ summary: 'create one selling product movement' })
	async createOne(@Req() request: CRequest, @Body() body: SellingProductMVCreateOneRequestDto): Promise<SellingProductMVModifyResponseDto> {
		return this.sellingProductMVService.createOne(request, body)
	}

	@Patch('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: SellingProductMVModifyResponseDto })
	@ApiOperation({ summary: 'update one selling product movement' })
	async updateOne(
		@Req() request: CRequest,
		@Query() query: SellingProductMVFindOneRequestDto,
		@Body() body: SellingProductMVUpdateOneRequestDto,
	): Promise<SellingProductMVModifyResponseDto> {
		return this.sellingProductMVService.updateOne(request, query, body)
	}

	@Delete('one')
	@ApiOkResponse({ type: SellingProductMVModifyResponseDto })
	@ApiOperation({ summary: 'delete one selling product movement' })
	async deleteOne(@Query() query: SellingProductMVDeleteOneRequestDto): Promise<SellingProductMVModifyResponseDto> {
		return this.sellingProductMVService.deleteOne(query)
	}
}
