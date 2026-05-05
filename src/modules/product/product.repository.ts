import { Injectable } from '@nestjs/common'
import { deletedAtConverter } from '@common'
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
import { PriceTypeEnum, Prisma } from '@prisma/client'
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

	private buildFindManyWhereInput(query: ProductFindManyRequest): Prisma.ProductModelWhereInput {
		const deletedAt = deletedAtConverter(query.isDeleted)
		return {
			...this.buildSearchFilter(query.search),
			...(deletedAt !== undefined ? { deletedAt } : {}),
		}
	}

	/** `many-new` agregatsiyasi: Prisma `where` bilan bir xil mantiq (qidiruv + soft-delete). */
	private buildRawWhereProduct(query: ProductFindManyRequest): Prisma.Sql {
		const parts: Prisma.Sql[] = []
		const deletedAt = deletedAtConverter(query.isDeleted)
		if (deletedAt === null) {
			parts.push(Prisma.sql`p.deleted_at IS NULL`)
		} else if (deletedAt !== undefined && typeof deletedAt === 'object' && deletedAt !== null && 'not' in deletedAt && deletedAt.not === null) {
			parts.push(Prisma.sql`p.deleted_at IS NOT NULL`)
		}

		const searchWords = query.search?.split(/\s+/).filter(Boolean) ?? []
		if (searchWords.length > 0) {
			const wordConds = searchWords.map((word) => Prisma.sql`p.name ILIKE ${'%' + word + '%'}`)
			const combined = searchWords.length > 1 ? Prisma.join(wordConds, ' AND ') : wordConds[0]!
			parts.push(Prisma.sql`(${combined})`)
		}

		if (parts.length === 0) return Prisma.sql`TRUE`
		return Prisma.join(parts, ' AND ')
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
					where: { selling: { clientId: query.clientId } },
					select: {
						count: true,
						prices: { orderBy: [{ createdAt: 'desc' as const }], select: { price: true, type: true } },
						selling: { select: { date: true } },
					},
				},
			},
			orderBy: [{ name: 'asc' }],
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
			orderBy: [{ name: 'asc' }],
		})
	}

	/** `GET product/many-new` — valyuta JOIN siz narxlar, `clientId` bo‘lmasa `sellingMVs` yuklanmaydi. */
	async findManyFast(query: ProductFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const hasClientFilter = query.clientId != null && String(query.clientId).trim() !== ''

		const baseSelect = {
			id: true,
			count: true,
			createdAt: true,
			description: true,
			name: true,
			minAmount: true,
			image: true,
			prices: {
				select: {
					id: true,
					type: true,
					price: true,
					totalPrice: true,
					currencyId: true,
					exchangeRate: true,
				},
			},
		} as const

		const select = hasClientFilter
			? {
					...baseSelect,
					sellingMVs: {
						orderBy: { selling: { date: 'desc' as const } },
						take: 1,
						where: { selling: { clientId: query.clientId } },
						select: {
							count: true,
							prices: { orderBy: [{ createdAt: 'desc' as const }], select: { price: true, type: true } },
							selling: { select: { date: true } },
						},
					},
				}
			: baseSelect

		return this.prisma.productModel.findMany({
			where: this.buildFindManyWhereInput(query),
			select,
			orderBy: [{ name: 'asc' }],
			...paginationOptions,
		})
	}

	/**
	 * Sahifa soni + ombor soni + narx agregatlari: COUNT va SUM(count) bitta SQL da (kamaytirilgan round-trip).
	 */
	async fetchFindManyAggregatesFast(query: ProductFindManyRequest): Promise<{
		productsCount: bigint
		totalInventoryUnits: bigint
		priceAgg: Array<{ type: string; currency_id: string; sum_total: unknown }>
	}> {
		const w = this.buildRawWhereProduct(query)
		const [metaRows, priceRows] = await Promise.all([
			this.prisma.$queryRaw<Array<{ row_count: bigint; inventory_sum: bigint }>>`
				SELECT
					(SELECT COUNT(*)::bigint FROM product p WHERE ${w}) AS row_count,
					(SELECT COALESCE(SUM(p.count), 0)::bigint FROM product p WHERE ${w}) AS inventory_sum
			`,
			this.prisma.$queryRaw<Array<{ type: string; currency_id: string; sum_total: unknown }>>`
				SELECT pp.type::text AS type, pp.currency_id::text AS currency_id, SUM(pp.total_price) AS sum_total
				FROM product p
				INNER JOIN product_price pp ON pp.product_id = p.id AND pp.deleted_at IS NULL
				WHERE ${w}
				GROUP BY pp.type, pp.currency_id
			`,
		])

		const m = metaRows[0]
		return {
			productsCount: m?.row_count ?? 0n,
			totalInventoryUnits: m?.inventory_sum ?? 0n,
			priceAgg: priceRows,
		}
	}

	async getMany(query: ProductGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const products = await this.prisma.productModel.findMany({
			where: { id: { in: query.ids }, name: query.name },
			include: { prices: { select: PRICE_SELECT } },
			orderBy: [{ name: 'asc' }],
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

	async createProductPrice(productId: string, data: { type: PriceTypeEnum; price: Decimal; totalPrice: Decimal; currencyId: string; exchangeRate: Decimal }) {
		return await this.prisma.productPriceModel.create({
			data: {
				productId,
				type: data.type,
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
