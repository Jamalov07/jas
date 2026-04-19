import { Controller, ParseFilePipe, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common'
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { UploadService } from './upload.service'
import { UploadQueryDto } from './dtos/request.dto'
import { FileInterceptor } from '@nestjs/platform-express'
import { Express } from 'express'
import { EXCEL_FILE_PIPE } from './helpers'
import { Multer } from 'multer'

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
	constructor(private readonly uploadService: UploadService) {}

	@Post('supplier')
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' },
			},
		},
	})
	@UseInterceptors(FileInterceptor('file'))
	async uploadSupplier(@UploadedFile(new ParseFilePipe(EXCEL_FILE_PIPE)) file: Express.Multer.File, @Query() query: UploadQueryDto) {
		return this.uploadService.uploadSupplier(file, query)
	}

	@Post('client')
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' },
			},
		},
	})
	async uploadClient(@UploadedFile(new ParseFilePipe(EXCEL_FILE_PIPE)) file: Express.Multer.File, @Query() query: UploadQueryDto) {
		return this.uploadService.uploadClient(file, query)
	}

	@Post('product')
	@UseInterceptors(FileInterceptor('file'))
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				file: { type: 'string', format: 'binary' },
			},
		},
	})
	async uploadProduct(@UploadedFile(new ParseFilePipe(EXCEL_FILE_PIPE)) file: Express.Multer.File, @Query() query: UploadQueryDto) {
		return this.uploadService.uploadProduct(file, query)
	}
}
