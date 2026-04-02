import { Body, Controller, Delete, Get, Patch, Post, Query, Res, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
	SupplierFindManyRequestDto,
	SupplierFindOneRequestDto,
	SupplierFindManyResponseDto,
	SupplierFindOneResponseDto,
	SupplierModifyResponseDto,
	SupplierUpdateOneRequestDto,
	SupplierDeleteOneRequestDto,
	SupplierCreateOneRequestDto,
	SupplierCreateOneResponseDto,
} from './dtos'
import { SupplierService } from './supplier.service'
import { Response } from 'express'
import { CheckPermissionGuard } from '../../common'

@ApiTags('Supplier')
@Controller('supplier')
@UseGuards(CheckPermissionGuard)
export class SupplierController {
	private readonly supplierService: SupplierService

	constructor(supplierService: SupplierService) {
		this.supplierService = supplierService
	}

	@Get('many')
	@ApiOkResponse({ type: SupplierFindManyResponseDto })
	@ApiOperation({ summary: 'get all suppliers' })
	async findMany(@Query() query: SupplierFindManyRequestDto): Promise<SupplierFindManyResponseDto> {
		return this.supplierService.findMany({ ...query, isDeleted: false })
	}

	@Get('excel-download/many')
	@ApiOperation({ summary: 'download many clients' })
	async excelDownloadMany(@Res() res: Response, @Query() query: SupplierFindManyRequestDto) {
		return this.supplierService.excelDownloadMany(res, query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one supplier' })
	@ApiOkResponse({ type: SupplierFindOneResponseDto })
	async findOne(@Query() query: SupplierFindOneRequestDto): Promise<SupplierFindOneResponseDto> {
		return this.supplierService.findOne(query)
	}

	@Get('excel-download/one')
	@ApiOperation({ summary: 'download one supplier' })
	async excelDownloadOne(@Res() res: Response, @Query() query: SupplierFindOneRequestDto) {
		return this.supplierService.excelDownloadOne(res, query)
	}

	@Get('excel-with-product-download/one')
	@ApiOperation({ summary: 'download one supplier' })
	async excelWithProductDownloadOne(@Res() res: Response, @Query() query: SupplierFindOneRequestDto) {
		return this.supplierService.excelWithProductDownloadOne(res, query)
	}

	@Post('one')
	@ApiOperation({ summary: 'create one supplier' })
	@ApiOkResponse({ type: SupplierCreateOneResponseDto })
	async createOne(@Body() body: SupplierCreateOneRequestDto): Promise<SupplierCreateOneResponseDto> {
		return this.supplierService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one supplier' })
	@ApiOkResponse({ type: SupplierModifyResponseDto })
	async updateOne(@Query() query: SupplierFindOneRequestDto, @Body() body: SupplierUpdateOneRequestDto): Promise<SupplierModifyResponseDto> {
		return this.supplierService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one supplier' })
	@ApiOkResponse({ type: SupplierModifyResponseDto })
	async deleteOne(@Query() query: SupplierDeleteOneRequestDto): Promise<SupplierModifyResponseDto> {
		return this.supplierService.deleteOne(query)
	}
}
