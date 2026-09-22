import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthOptions, CheckPermissionGuard } from '@common'
import { ProductCategoryService } from './product-category.service'
import {
	ProductCategoryCreateOneRequestDto,
	ProductCategoryDeleteOneRequestDto,
	ProductCategoryFindManyRequestDto,
	ProductCategoryFindManyResponseDto,
	ProductCategoryFindOneRequestDto,
	ProductCategoryFindOneResponseDto,
	ProductCategoryModifyResponseDto,
	ProductCategoryUpdateOneRequestDto,
} from './dtos'

@ApiTags('ProductCategory')
@UseGuards(CheckPermissionGuard)
@Controller('product-category')
export class ProductCategoryController {
	constructor(private readonly productCategoryService: ProductCategoryService) {}

	@Get('many')
	@ApiOkResponse({ type: ProductCategoryFindManyResponseDto })
	@ApiOperation({ summary: 'get all product categories' })
	@AuthOptions(false, false)
	async findMany(@Query() query: ProductCategoryFindManyRequestDto): Promise<ProductCategoryFindManyResponseDto> {
		return this.productCategoryService.findMany(query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one product category' })
	@ApiOkResponse({ type: ProductCategoryFindOneResponseDto })
	async findOne(@Query() query: ProductCategoryFindOneRequestDto): Promise<ProductCategoryFindOneResponseDto> {
		return this.productCategoryService.findOne(query)
	}

	@Post('one')
	@ApiOperation({ summary: 'add one product category' })
	@ApiOkResponse({ type: ProductCategoryModifyResponseDto })
	async createOne(@Body() body: ProductCategoryCreateOneRequestDto): Promise<ProductCategoryModifyResponseDto> {
		return this.productCategoryService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one product category' })
	@ApiOkResponse({ type: ProductCategoryModifyResponseDto })
	async updateOne(
		@Query() query: ProductCategoryFindOneRequestDto,
		@Body() body: ProductCategoryUpdateOneRequestDto,
	): Promise<ProductCategoryModifyResponseDto> {
		return this.productCategoryService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one product category' })
	@ApiOkResponse({ type: ProductCategoryModifyResponseDto })
	async deleteOne(@Query() query: ProductCategoryDeleteOneRequestDto): Promise<ProductCategoryModifyResponseDto> {
		return this.productCategoryService.deleteOne(query)
	}
}
