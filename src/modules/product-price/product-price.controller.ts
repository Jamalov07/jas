import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProductPriceService } from './product-price.service'
import { AuthOptions, CheckPermissionGuard } from '@common'
import {
	ProductPriceFindManyRequestDto,
	ProductPriceFindManyResponseDto,
	ProductPriceFindOneRequestDto,
	ProductPriceFindOneResponseDto,
	ProductPriceCreateOneRequestDto,
	ProductPriceUpdateOneRequestDto,
	ProductPriceModifyResponseDto,
} from './dtos'

@ApiTags('ProductPrice')
@UseGuards(CheckPermissionGuard)
@Controller('product-price')
export class ProductPriceController {
	constructor(private readonly productPriceService: ProductPriceService) {}

	@Get('many')
	@ApiOkResponse({ type: ProductPriceFindManyResponseDto })
	@ApiOperation({ summary: 'get all product prices' })
	@AuthOptions(false, false)
	async findMany(@Query() query: ProductPriceFindManyRequestDto): Promise<ProductPriceFindManyResponseDto> {
		return this.productPriceService.findMany(query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one product price' })
	@ApiOkResponse({ type: ProductPriceFindOneResponseDto })
	async findOne(@Query() query: ProductPriceFindOneRequestDto): Promise<ProductPriceFindOneResponseDto> {
		return this.productPriceService.findOne(query)
	}

	@Post('one')
	@ApiOperation({ summary: 'add one product price' })
	@ApiOkResponse({ type: ProductPriceModifyResponseDto })
	async createOne(@Body() body: ProductPriceCreateOneRequestDto): Promise<ProductPriceModifyResponseDto> {
		return this.productPriceService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one product price' })
	@ApiOkResponse({ type: ProductPriceModifyResponseDto })
	async updateOne(@Query() query: ProductPriceFindOneRequestDto, @Body() body: ProductPriceUpdateOneRequestDto): Promise<ProductPriceModifyResponseDto> {
		return this.productPriceService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one product price' })
	@ApiOkResponse({ type: ProductPriceModifyResponseDto })
	async deleteOne(@Query() query: ProductPriceFindOneRequestDto): Promise<ProductPriceModifyResponseDto> {
		return this.productPriceService.deleteOne(query)
	}
}
