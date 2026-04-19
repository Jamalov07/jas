import { Body, Controller, Delete, Get, Patch, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { ProductService } from './product.service'
import { AuthOptions, CheckPermissionGuard } from '@common'
import { Response, Express } from 'express'
import {
	ProductFindManyRequestDto,
	ProductCreateOneRequestDto,
	ProductUpdateOneRequestDto,
	ProductFindOneRequestDto,
	ProductFindManyResponseDto,
	ProductFindOneResponseDto,
	ProductModifyResponseDto,
	ProductCreateOne2RequestDto,
	ProductUpdateOne2RequestDto,
} from './dtos'
import { FileInterceptor } from '@nestjs/platform-express'
import { Decimal } from '@prisma/client/runtime/library'

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

	@Get('one')
	@ApiOperation({ summary: 'find one product' })
	@ApiOkResponse({ type: ProductFindOneResponseDto })
	async getOne(@Query() query: ProductFindOneRequestDto): Promise<ProductFindOneResponseDto> {
		return this.productService.findOne(query)
	}

	@Post('one')
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(FileInterceptor('image'))
	@ApiOperation({ summary: 'add one product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async createOne(@Body() body: ProductCreateOne2RequestDto, @UploadedFile() image?: Express.Multer.File): Promise<ProductModifyResponseDto> {
		console.log(body)

		const prices = {
			cost: {
				price: new Decimal(Number(body.prices_cost_price)),
				currencyId: body.prices_cost_currencyId,
			},
			selling: {
				price: new Decimal(Number(body.prices_selling_price)),
				currencyId: body.prices_selling_currencyId,
			},
			wholesale: body.prices_wholesale_price
				? {
						price: new Decimal(Number(body.prices_wholesale_price)),
						currencyId: body.prices_wholesale_currencyId,
					}
				: undefined,
		}
		return this.productService.createOne({ ...body, prices, image: image?.filename })
	}

	@Patch('one')
	@ApiConsumes('multipart/form-data')
	@UseInterceptors(FileInterceptor('image'))
	@ApiOperation({ summary: 'update one product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async updateOne(
		@Query() query: ProductFindOneRequestDto,
		@Body() body: ProductUpdateOne2RequestDto,
		@UploadedFile() image?: Express.Multer.File,
	): Promise<ProductModifyResponseDto> {
		const prices: Record<string, { price: Decimal; currencyId: string }> = {}

		if (body.prices_cost_price && body.prices_cost_currencyId) {
			prices.cost = { price: new Decimal(Number(body.prices_cost_price)), currencyId: body.prices_cost_currencyId }
		}

		if (body.prices_selling_currencyId && !body.prices_selling_price) {
			prices.selling = { price: new Decimal(0), currencyId: body.prices_selling_currencyId }
		}

		if (!body.prices_wholesale_currencyId && body.prices_wholesale_price) {
			prices.wholesale = { price: new Decimal(Number(body.prices_wholesale_price)), currencyId: body.prices_wholesale_currencyId }
		}

		return this.productService.updateOne(query, { ...body, prices: prices ?? undefined, image: image?.filename })
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one product' })
	@ApiOkResponse({ type: ProductModifyResponseDto })
	async deleteOne(@Query() query: ProductFindOneRequestDto): Promise<ProductModifyResponseDto> {
		return this.productService.deleteOne(query)
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'download many products as excel' })
	async excelDownloadMany(@Res() res: Response, @Query() query: ProductFindManyRequestDto) {
		return this.productService.excelDownloadMany(res, query)
	}
}
