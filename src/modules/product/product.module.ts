import { BadRequestException, Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { CurrencyModule } from '../currency/currency.module'
import { ProductController } from './product.controller'
import { ProductService } from './product.service'
import { ProductRepository } from './product.repository'
import { MulterModule } from '@nestjs/platform-express'
import multer from 'multer'
import { extname } from 'path'

@Module({
	imports: [
		MulterModule.register({
			storage: multer.diskStorage({
				destination: (req, file, cb) => {
					if (file.mimetype.startsWith('image/')) {
						cb(null, `${process.cwd()}/uploads`)
					} else {
						cb(new BadRequestException('Unsupported file type'), '')
					}
				},
				filename: (req, file, cb) => {
					const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
					cb(null, `${uniqueSuffix}${extname(file.originalname)}`)
				},
			}),
			fileFilter: (req, file, cb) => {
				const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']

				if (allowedImageTypes.includes(file.mimetype)) {
					cb(null, true)
				} else {
					cb(new BadRequestException('Unsupported file type'), false)
				}
			},
		}),
		PrismaModule,
		ExcelModule,
		CurrencyModule,
	],
	controllers: [ProductController],
	providers: [ProductService, ProductRepository],
	exports: [ProductService, ProductRepository],
})
export class ProductModule {}
