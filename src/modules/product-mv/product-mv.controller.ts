import { Body, Controller, Delete, Get, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { ProductMVService } from './product-mv.service'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	arrivalProductMVCreateOneRequestDto,
	ArrivalProductMVUpdateOneRequestDto,
	ProductMVDeleteOneRequestDto,
	ProductMVFindManyRequestDto,
	ProductMVFindManyResponseDto,
	ProductMVFindOneRequestDto,
	ProductMVFindOneResponseDto,
	ReturningProductMVCreateOneRequestDto,
	ReturningProductMVUpdateOneRequestDto,
	SellingProductMVCreateOneRequestDto,
	SellingProductMVUpdateOneRequestDto,
} from './dtos'
import { AuthOptions, CheckPermissionGuard, CRequest } from '../../common'
import { ProductModifyResponseDto } from '../product/dtos'

@Controller('product-mv')
@ApiTags('Product Movement')
@UseGuards(CheckPermissionGuard)
export class ProductMVController {
	private readonly productMVService: ProductMVService
	constructor(productMVService: ProductMVService) {
		this.productMVService = productMVService
	}

	@Get('many')
	@ApiOkResponse({ type: ProductMVFindManyResponseDto })
	@ApiOperation({ summary: 'get all products' })
	@AuthOptions(false, false)
	async findMany(@Query() query: ProductMVFindManyRequestDto): Promise<ProductMVFindManyResponseDto> {
		return this.productMVService.findMany({ ...query, isDeleted: false })
	}

	@Get('many-product-stats')
	@ApiOkResponse({ type: null })
	@ApiOperation({ summary: 'get all products stats' })
	@AuthOptions(false, false)
	async findManyProductStats(@Query() query: ProductMVFindManyRequestDto): Promise<any> {
		return this.productMVService.findManyProductStats({ ...query, pagination: false, isDeleted: false })
	}

	@Get('one')
	@ApiOperation({ summary: 'find one product' })
	@ApiOkResponse({ type: ProductMVFindOneResponseDto })
	async getOne(@Query() query: ProductMVFindOneRequestDto): Promise<ProductMVFindOneResponseDto> {
		return this.productMVService.findOne(query)
	}

	@Post('selling/one')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'add one selling product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async createOneSelling(@Req() request: CRequest, @Body() body: SellingProductMVCreateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productMVService.createOneSelling(request, body)
	}

	@Post('arrival/one')
	@ApiOperation({ summary: 'add one arrival product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async createOneArrival(@Req() request: CRequest, @Body() body: arrivalProductMVCreateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productMVService.createOneArrival(request, body)
	}

	@Post('returning/one')
	@ApiOperation({ summary: 'add one returning product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async createOneReturning(@Req() request: CRequest, @Body() body: ReturningProductMVCreateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productMVService.createOneReturning(request, body)
	}

	@Patch('selling/one')
	@ApiOperation({ summary: 'update one selling product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async updateOneSelling(@Query() query: ProductMVFindOneRequestDto, @Body() body: SellingProductMVUpdateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productMVService.updateOneSelling(query, body)
	}

	@Patch('arrival/one')
	@ApiOperation({ summary: 'update one arrival product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async updateOneArrival(@Query() query: ProductMVFindOneRequestDto, @Body() body: ArrivalProductMVUpdateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productMVService.updateOneArrival(query, body)
	}

	@Patch('returning/one')
	@ApiOperation({ summary: 'update one returning product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async updateOneReturning(@Query() query: ProductMVFindOneRequestDto, @Body() body: ReturningProductMVUpdateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productMVService.updateOneReturning(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'update one product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async deleteOne(@Query() query: ProductMVDeleteOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productMVService.deleteOne(query)
	}
}
