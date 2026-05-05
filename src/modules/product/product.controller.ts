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
import type { ProductPricesUpdateInput } from './interfaces'
import { FileInterceptor } from '@nestjs/platform-express'
import { Decimal } from '@prisma/client/runtime/library'

@ApiTags('Product')
@UseGuards(CheckPermissionGuard)
@Controller('product')
export class ProductController {
	constructor(private readonly productService: ProductService) {}

	@Get('many-new')
	@ApiOkResponse({ type: ProductFindManyResponseDto })
	@ApiOperation({ summary: 'get all products (optimized: parallel queries + SQL totals)' })
	@AuthOptions(false, false)
	async findManyNew(@Query() query: ProductFindManyRequestDto): Promise<ProductFindManyResponseDto> {
		return this.productService.findManyNew({ ...query, isDeleted: false })
	}

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
		const prices = {
			cost: {
				price: new Decimal(Number(body.prices_cost_price ?? 0)),
				currencyId: body.prices_cost_currencyId,
			},
			selling: {
				price: new Decimal(Number(body.prices_selling_price ?? 0)),
				currencyId: body.prices_selling_currencyId,
			},
			// Optom narx 0 bo‘lishi mumkin — shart faqat valyuta ID (0 truthy emas, eski kod wholesale ni tashlab yuborardi)
			wholesale: body.prices_wholesale_currencyId
				? {
						price: new Decimal(Number(body.prices_wholesale_price ?? 0)),
						currencyId: body.prices_wholesale_currencyId,
					}
				: {
						price: new Decimal(0),
						currencyId: body.prices_selling_currencyId ?? body.prices_cost_currencyId,
					},
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
		const prices = this.buildPricesUpdateFromMultipart(body)

		return this.productService.updateOne(query, { ...body, prices, image: image?.filename })
	}

	/** multipart/form-data flat maydonlardan `ProductPricesUpdateInput` — `createOne` bilan mos, partial yangilanish */
	private buildPricesUpdateFromMultipart(body: ProductUpdateOne2RequestDto): ProductPricesUpdateInput | undefined {
		const prices: ProductPricesUpdateInput = {}

		const hasCost = body.prices_cost_currencyId != null || body.prices_cost_price !== undefined
		if (hasCost) {
			prices.cost = {
				...(body.prices_cost_price !== undefined ? { price: new Decimal(Number(body.prices_cost_price)) } : {}),
				...(body.prices_cost_currencyId ? { currencyId: body.prices_cost_currencyId } : {}),
			}
		}

		const hasSelling = body.prices_selling_currencyId != null || body.prices_selling_price !== undefined
		if (hasSelling) {
			prices.selling = {
				...(body.prices_selling_price !== undefined ? { price: new Decimal(Number(body.prices_selling_price)) } : {}),
				...(body.prices_selling_currencyId ? { currencyId: body.prices_selling_currencyId } : {}),
			}
		}

		const hasWholesale = body.prices_wholesale_currencyId != null || body.prices_wholesale_price !== undefined
		if (hasWholesale) {
			prices.wholesale = {
				...(body.prices_wholesale_price !== undefined ? { price: new Decimal(Number(body.prices_wholesale_price ?? 0)) } : {}),
				...(body.prices_wholesale_currencyId ? { currencyId: body.prices_wholesale_currencyId } : {}),
			}
		}

		return Object.keys(prices).length ? prices : undefined
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
