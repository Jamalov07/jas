import { Body, Controller, Delete, Get, Patch, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProductService } from './product.service'
import { AuthOptions, CheckPermissionGuard } from '@common'
import {
	ProductFindManyRequestDto,
	ProductCreateOneRequestDto,
	ProductUpdateOneRequestDto,
	ProductFindOneRequestDto,
	ProductFindManyResponseDto,
	ProductFindOneResponseDto,
	ProductModifyResponseDto,
} from './dtos'
import { Response } from 'express'

@ApiTags('Product')
@UseGuards(CheckPermissionGuard)
@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Get('many')
	@ApiOkResponse({ type: ProductFindManyResponseDto })
	@ApiOperation({ summary: 'get all products' })
	@AuthOptions(false, false)
	async findMany(@Query() query: ProductFindManyRequestDto): Promise<ProductFindManyResponseDto> {
		return this.productService.findMany({ ...query, isDeleted: false })
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'download many clients' })
	async excelDownloadMany(@Res() res: Response, @Query() query: ProductFindManyRequestDto) {
		return this.productService.excelDownloadMany(res, query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one product' })
	@ApiOkResponse({ type: ProductFindOneResponseDto })
	async getOne(@Query() query: ProductFindOneRequestDto): Promise<ProductFindOneResponseDto> {
		return this.productService.findOne(query)
	}

	@Post('one')
	@ApiOperation({ summary: 'add one product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async createOne(@Body() body: ProductCreateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async updateOne(@Query() query: ProductFindOneRequestDto, @Body() body: ProductUpdateOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'update one product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async deleteOne(@Query() query: ProductFindOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productService.deleteOne(query)
	}
}
