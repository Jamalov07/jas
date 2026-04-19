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
import { PriceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const PRICE_SELECT = {
	id: true,
	type: true,
	price: true,
	totalPrice: true,
	currencyId: true,
	currency: true,
	exchangeRate: true,
} as const

@Injectable()
export class ProductRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	private buildSearchFilter(search?: string) {
		if (!search) return {}
		const searchWords = search.split(/\s+/).filter(Boolean)
		return {
			[searchWords.length > 1 ? 'AND' : 'OR']: searchWords.map((word) => ({
				name: { contains: word, mode: 'insensitive' as const },
			})),
		}
	}

	async findMany(query: ProductFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const products = await this.prisma.productModel.findMany({
			where: { ...this.buildSearchFilter(query.search) },
			select: {
				id: true,
				count: true,
				createdAt: true,
				description: true,
				name: true,
				minAmount: true,
				image: true,
				prices: {
					select: { id: true, type: true, price: true, totalPrice: true, currencyId: true, currency: true, exchangeRate: true },
				},
				sellingMVs: {
					orderBy: { selling: { date: 'desc' } },
					take: 1,
					select: {
						count: true,
						prices: { orderBy: [{ createdAt: 'desc' as const }], select: { price: true, type: true } },
						selling: { select: { date: true } },
					},
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
				image: true,
				prices: { orderBy: [{ createdAt: 'desc' as const }], select: PRICE_SELECT },
				sellingMVs: {
					orderBy: { selling: { date: 'desc' } },
					take: 1,
					select: {
						count: true,
						prices: { orderBy: [{ createdAt: 'desc' as const }], select: { price: true, type: true } },
						selling: { select: { date: true } },
					},
				},
			},
		})

		return product
	}

	async countFindMany(query: ProductFindManyRequest) {
		const count = await this.prisma.productModel.count({
			where: { ...this.buildSearchFilter(query.search) },
		})

		return count
	}

	/** `findMany` filteri bilan mos keladigan barcha mahsulotlar uchun calcTotal (yengil select) */
	async findManyForInventoryCalc(query: ProductFindManyRequest) {
		return this.prisma.productModel.findMany({
			where: { ...this.buildSearchFilter(query.search) },
			select: {
				count: true,
				prices: { orderBy: [{ createdAt: 'desc' as const }], select: { type: true, totalPrice: true, currencyId: true } },
			},
		})
	}

	async getMany(query: ProductGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const products = await this.prisma.productModel.findMany({
			where: { id: { in: query.ids }, name: query.name },
			include: { prices: { select: PRICE_SELECT } },
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
			include: { prices: true },
		})

		return product
	}

	async countGetMany(query: ProductGetManyRequest) {
		const count = await this.prisma.productModel.count({
			where: { id: { in: query.ids }, name: query.name },
		})

		return count
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
				image: body.image,
				prices: {
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
				image: body.image,
			},
		})

		return product
	}

	async findCurrencyExchangeRatesByIds(ids: string[]) {
		if (ids.length === 0) return new Map<string, Decimal>()
		const rows = await this.prisma.currencyModel.findMany({
			where: { id: { in: ids } },
			select: { id: true, exchangeRate: true },
		})
		return new Map(rows.map((r) => [r.id, r.exchangeRate ?? new Decimal(0)]))
	}

	async updateProductPrice(priceId: string, data: { price: Decimal; totalPrice: Decimal; currencyId: string; exchangeRate: Decimal }) {
		return await this.prisma.productPriceModel.update({
			where: { id: priceId },
			data: {
				price: data.price,
				totalPrice: data.totalPrice,
				currencyId: data.currencyId,
				exchangeRate: data.exchangeRate,
			},
		})
	}

	async deleteOne(query: ProductDeleteOneRequest) {
		const product = await this.prisma.productModel.delete({
			where: { id: query.id },
		})

		return product
	}
}
