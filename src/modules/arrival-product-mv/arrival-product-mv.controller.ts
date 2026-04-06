import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	ArrivalProductMVFindManyRequestDto,
	ArrivalProductMVFindOneRequestDto,
	ArrivalProductMVCreateOneRequestDto,
	ArrivalProductMVUpdateOneRequestDto,
	ArrivalProductMVDeleteOneRequestDto,
	ArrivalProductMVFindManyResponseDto,
	ArrivalProductMVFindOneResponseDto,
	ArrivalProductMVModifyResponseDto,
} from './dtos'
import { ArrivalProductMVService } from './arrival-product-mv.service'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'

@ApiTags('Arrival Product MV')
@Controller('arrival-product-mv')
@UseGuards(CheckPermissionGuard)
export class ArrivalProductMVController {
	constructor(private readonly arrivalProductMVService: ArrivalProductMVService) {}

	@Get('many')
	@ApiOkResponse({ type: ArrivalProductMVFindManyResponseDto })
	@ApiOperation({ summary: 'get many arrival product movements' })
	async findMany(@Query() query: ArrivalProductMVFindManyRequestDto): Promise<ArrivalProductMVFindManyResponseDto> {
		return this.arrivalProductMVService.findMany(query)
	}

	@Get('one')
	@ApiOkResponse({ type: ArrivalProductMVFindOneResponseDto })
	@ApiOperation({ summary: 'get one arrival product movement' })
	async findOne(@Query() query: ArrivalProductMVFindOneRequestDto): Promise<ArrivalProductMVFindOneResponseDto> {
		return this.arrivalProductMVService.findOne(query)
	}

	@Post('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ArrivalProductMVModifyResponseDto })
	@ApiOperation({ summary: 'create one arrival product movement' })
	async createOne(@Req() request: CRequest, @Body() body: ArrivalProductMVCreateOneRequestDto): Promise<ArrivalProductMVModifyResponseDto> {
		return this.arrivalProductMVService.createOne(request, body)
	}

	@Patch('one')
	@AuthOptions(true, true)
	@ApiOkResponse({ type: ArrivalProductMVModifyResponseDto })
	@ApiOperation({ summary: 'update one arrival product movement' })
	async updateOne(
		@Req() request: CRequest,
		@Query() query: ArrivalProductMVFindOneRequestDto,
		@Body() body: ArrivalProductMVUpdateOneRequestDto,
	): Promise<ArrivalProductMVModifyResponseDto> {
		return this.arrivalProductMVService.updateOne(request, query, body)
	}

	@Delete('one')
	@ApiOkResponse({ type: ArrivalProductMVModifyResponseDto })
	@ApiOperation({ summary: 'delete one arrival product movement' })
	async deleteOne(@Query() query: ArrivalProductMVDeleteOneRequestDto): Promise<ArrivalProductMVModifyResponseDto> {
		return this.arrivalProductMVService.deleteOne(query)
	}
}
