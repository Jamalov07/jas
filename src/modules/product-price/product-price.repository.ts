import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared'
import {
	ProductPriceCreateOneRequest,
	ProductPriceDeleteOneRequest,
	ProductPriceFindManyRequest,
	ProductPriceFindOneRequest,
	ProductPriceGetManyRequest,
	ProductPriceGetOneRequest,
	ProductPriceUpdateOneRequest,
} from './interfaces'
import { ProductPriceController } from './product-price.controller'

@Injectable()
export class ProductPriceRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: ProductPriceFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const productPrices = await this.prisma.productPriceModel.findMany({
			where: {
				productId: query.productId,
				currencyId: query.currencyId,
				type: query.type,
			},
			select: {
				id: true,
				type: true,
				price: true,
				totalPrice: true,
				productId: true,
				currencyId: true,
				exchangeRate: true,
			},
			...paginationOptions,
		})

		return productPrices
	}

	async countFindMany(query: ProductPriceFindManyRequest) {
		const productPricesCount = await this.prisma.productPriceModel.count({
			where: {
				productId: query.productId,
				currencyId: query.currencyId,
				type: query.type,
			},
		})

		return productPricesCount
	}

	async findOne(query: ProductPriceFindOneRequest) {
		const productPrice = await this.prisma.productPriceModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				type: true,
				price: true,
				totalPrice: true,
				productId: true,
				currencyId: true,
				exchangeRate: true,
			},
		})

		return productPrice
	}

	async getMany(query: ProductPriceGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const productPrices = await this.prisma.productPriceModel.findMany({
			where: {
				id: { in: query.ids },
				productId: query.productId,
				currencyId: query.currencyId,
				type: query.type,
			},
			...paginationOptions,
		})

		return productPrices
	}

	async countGetMany(query: ProductPriceGetManyRequest) {
		const productPricesCount = await this.prisma.productPriceModel.count({
			where: {
				id: { in: query.ids },
				productId: query.productId,
				currencyId: query.currencyId,
				type: query.type,
			},
		})

		return productPricesCount
	}

	async getOne(query: ProductPriceGetOneRequest) {
		const productPrice = await this.prisma.productPriceModel.findFirst({
			where: {
				id: query.id,
				productId: query.productId,
				currencyId: query.currencyId,
				type: query.type,
			},
		})

		return productPrice
	}

	async createOne(body: ProductPriceCreateOneRequest) {
		const productPrice = await this.prisma.productPriceModel.create({
			data: {
				type: body.type,
				price: body.price,
				totalPrice: body.totalPrice,
				productId: body.productId,
				currencyId: body.currencyId,
				exchangeRate: body.exchangeRate,
			},
		})

		return productPrice
	}

	async updateOne(query: ProductPriceGetOneRequest, body: ProductPriceUpdateOneRequest) {
		const productPrice = await this.prisma.productPriceModel.update({
			where: { id: query.id },
			data: {
				type: body.type,
				price: body.price,
				totalPrice: body.totalPrice,
				currencyId: body.currencyId,
				exchangeRate: body.exchangeRate,
			},
		})

		return productPrice
	}

	async deleteOne(query: ProductPriceDeleteOneRequest) {
		const productPrice = await this.prisma.productPriceModel.delete({
			where: { id: query.id },
		})

		return productPrice
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(ProductPriceController)
	}
}
