import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared'
import {
	ProductCreateOneRequest,
	ProductDeleteOneRequest,
	ProductFindManyRequest,
	ProductFindOneRequest,
	ProductGetManyRequest,
	ProductGetOneRequest,
	ProductUpdateOneRequest,
} from './interfaces'
import { ProductController } from './product.controller'
import { PriceTypeEnum, ServiceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const PRICE_SELECT = {
	id: true,
	type: true,
	price: true,
	totalPrice: true,
	currencyId: true,
	exchangeRate: true,
} as const

@Injectable()
export class ProductRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: ProductFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		let nameFilter: any = {}
		if (query.search) {
			const searchWords = query.search?.split(/\s+/).filter(Boolean) ?? []

			nameFilter = {
				[searchWords.length > 1 ? 'AND' : 'OR']: searchWords.map((word) => ({
					name: {
						contains: word,
						mode: 'insensitive',
					},
				})),
			}
		}

		const products = await this.prisma.productModel.findMany({
			where: {
				...nameFilter,
			},
			select: {
				id: true,
				count: true,
				createdAt: true,
				description: true,
				name: true,
				minAmount: true,
				productPrices: { select: PRICE_SELECT },
				productMVs: {
					where: { type: ServiceTypeEnum.selling },
					orderBy: { selling: { date: 'desc' } },
					take: 1,
					select: { count: true, price: true, selling: { select: { date: true } } },
				},
			},
			...paginationOptions,
		})

		return products
	}

	async findOne(query: ProductFindOneRequest) {
		const product = await this.prisma.productModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				count: true,
				createdAt: true,
				description: true,
				name: true,
				minAmount: true,
				productPrices: { select: PRICE_SELECT },
				productMVs: {
					where: { type: ServiceTypeEnum.selling },
					orderBy: { selling: { date: 'desc' } },
					take: 1,
					select: { price: true, count: true, selling: { select: { date: true } } },
				},
			},
		})

		return product
	}

	async countFindMany(query: ProductFindManyRequest) {
		let nameFilter: any = {}
		if (query.search) {
			const searchWords = query.search?.split(/\s+/).filter(Boolean) ?? []

			nameFilter = {
				[searchWords.length > 1 ? 'AND' : 'OR']: searchWords.map((word) => ({
					name: {
						contains: word,
						mode: 'insensitive',
					},
				})),
			}
		}

		const productsCount = await this.prisma.productModel.count({
			where: {
				...nameFilter,
			},
		})

		return productsCount
	}

	async getMany(query: ProductGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const products = await this.prisma.productModel.findMany({
			where: { id: { in: query.ids }, name: query.name },
			include: { productPrices: { select: PRICE_SELECT } },
			...paginationOptions,
		})

		return products
	}

	async getOne(query: ProductGetOneRequest) {
		const product = await this.prisma.productModel.findFirst({
			where: { id: query.id, name: query.name },
		})

		return product
	}

	async getOneWithPrices(query: ProductGetOneRequest) {
		const product = await this.prisma.productModel.findFirst({
			where: { id: query.id, name: query.name },
			include: { productPrices: true },
		})

		return product
	}

	async countGetMany(query: ProductGetManyRequest) {
		const productsCount = await this.prisma.productModel.count({
			where: { id: { in: query.ids }, name: query.name },
		})

		return productsCount
	}

	async createOne(body: ProductCreateOneRequest) {
		const currencyIds = [body.prices.cost.currencyId, body.prices.selling.currencyId, body.prices.wholesale.currencyId]

		const currencies = await this.prisma.currencyModel.findMany({
			where: { id: { in: currencyIds } },
			select: { id: true, exchangeRate: true },
		})

		const getExchangeRate = (currencyId: string) => currencies.find((c) => c.id === currencyId)?.exchangeRate ?? new Decimal(0)

		const product = await this.prisma.productModel.create({
			data: {
				name: body.name,
				count: body.count,
				minAmount: body.minAmount,
				description: body.description,
				productPrices: {
					create: [
						{
							type: PriceTypeEnum.cost,
							price: body.prices.cost.price,
							totalPrice: new Decimal(body.count).mul(body.prices.cost.price),
							currencyId: body.prices.cost.currencyId,
							exchangeRate: getExchangeRate(body.prices.cost.currencyId),
						},
						{
							type: PriceTypeEnum.selling,
							price: body.prices.selling.price,
							totalPrice: new Decimal(body.count).mul(body.prices.selling.price),
							currencyId: body.prices.selling.currencyId,
							exchangeRate: getExchangeRate(body.prices.selling.currencyId),
						},
						{
							type: PriceTypeEnum.wholesale,
							price: body.prices.wholesale.price,
							totalPrice: new Decimal(body.count).mul(body.prices.wholesale.price),
							currencyId: body.prices.wholesale.currencyId,
							exchangeRate: getExchangeRate(body.prices.wholesale.currencyId),
						},
					],
				},
			},
		})

		return product
	}

	async updateOne(query: ProductGetOneRequest, body: ProductUpdateOneRequest) {
		const product = await this.prisma.productModel.update({
			where: { id: query.id },
			data: {
				name: body.name,
				count: body.count,
				minAmount: body.minAmount,
				description: body.description,
			},
		})

		return product
	}

	async updateProductPrice(priceId: string, price: Decimal, totalPrice: Decimal) {
		return await this.prisma.productPriceModel.update({
			where: { id: priceId },
			data: { price, totalPrice },
		})
	}

	async deleteOne(query: ProductDeleteOneRequest) {
		const product = await this.prisma.productModel.delete({
			where: { id: query.id },
		})

		return product
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(ProductController)
	}
}
