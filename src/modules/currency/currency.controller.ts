import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrencyService } from './currency.service'
import { AuthOptions, CheckPermissionGuard } from '@common'
import {
	CurrencyFindManyRequestDto,
	CurrencyFindManyResponseDto,
	CurrencyFindOneRequestDto,
	CurrencyFindOneResponseDto,
	CurrencyCreateOneRequestDto,
	CurrencyUpdateOneRequestDto,
	CurrencyModifyResponseDto,
} from './dtos'

@ApiTags('Currency')
@UseGuards(CheckPermissionGuard)
@Controller('currency')
export class CurrencyController {
	constructor(private readonly currencyService: CurrencyService) {}

	@Get('many')
	@ApiOkResponse({ type: CurrencyFindManyResponseDto })
	@ApiOperation({ summary: 'get all currencies' })
	@AuthOptions(false, false)
	async findMany(@Query() query: CurrencyFindManyRequestDto): Promise<CurrencyFindManyResponseDto> {
		return this.currencyService.findMany(query)
	}

	@Get('one')
	@ApiOperation({ summary: 'find one currency' })
	@ApiOkResponse({ type: CurrencyFindOneResponseDto })
	async findOne(@Query() query: CurrencyFindOneRequestDto): Promise<CurrencyFindOneResponseDto> {
		return this.currencyService.findOne(query)
	}

	@Post('one')
	@ApiOperation({ summary: 'add one currency' })
	@ApiOkResponse({ type: CurrencyModifyResponseDto })
	async createOne(@Body() body: CurrencyCreateOneRequestDto): Promise<CurrencyModifyResponseDto> {
		return this.currencyService.createOne(body)
	}

	@Patch('one')
	@ApiOperation({ summary: 'update one currency' })
	@ApiOkResponse({ type: CurrencyModifyResponseDto })
	async updateOne(@Query() query: CurrencyFindOneRequestDto, @Body() body: CurrencyUpdateOneRequestDto): Promise<CurrencyModifyResponseDto> {
		return this.currencyService.updateOne(query, body)
	}

	@Delete('one')
	@ApiOperation({ summary: 'delete one currency' })
	@ApiOkResponse({ type: CurrencyModifyResponseDto })
	async deleteOne(@Query() query: CurrencyFindOneRequestDto): Promise<CurrencyModifyResponseDto> {
		return this.currencyService.deleteOne(query)
	}
}
