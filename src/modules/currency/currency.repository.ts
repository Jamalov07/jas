import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared'
import {
	CurrencyCreateOneRequest,
	CurrencyDeleteOneRequest,
	CurrencyFindManyRequest,
	CurrencyFindOneRequest,
	CurrencyGetManyRequest,
	CurrencyGetOneRequest,
	CurrencyUpdateOneRequest,
} from './interfaces'
@Injectable()
export class CurrencyRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: CurrencyFindManyRequest) {
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

		const currencies = await this.prisma.currencyModel.findMany({
			where: {
				...nameFilter,
				symbol: query.symbol,
				isActive: query.isActive,
			},
			select: {
				id: true,
				name: true,
				symbol: true,
				isActive: true,
				exchangeRate: true,
				createdAt: true,
			},
			...paginationOptions,
		})

		return currencies
	}

	async findAllActiveIds(): Promise<string[]> {
		const rows = await this.prisma.currencyModel.findMany({
			where: { isActive: true, deletedAt: null },
			select: { id: true },
			orderBy: { name: 'asc' },
		})
		return rows.map((r) => r.id)
	}

	async findBriefByIds(ids: string[]): Promise<Array<{ id: string; name: string; symbol: string }>> {
		const unique = [...new Set(ids.filter(Boolean))]
		if (unique.length === 0) return []
		return this.prisma.currencyModel.findMany({
			where: { id: { in: unique } },
			select: { id: true, name: true, symbol: true },
		})
	}

	async countFindMany(query: CurrencyFindManyRequest) {
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

		const currenciesCount = await this.prisma.currencyModel.count({
			where: {
				...nameFilter,
				symbol: query.symbol,
				isActive: query.isActive,
			},
		})

		return currenciesCount
	}

	async findOne(query: CurrencyFindOneRequest) {
		const currency = await this.prisma.currencyModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				name: true,
				symbol: true,
				isActive: true,
				exchangeRate: true,
				createdAt: true,
			},
		})

		return currency
	}

	async getMany(query: CurrencyGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const currencies = await this.prisma.currencyModel.findMany({
			where: { id: { in: query.ids }, name: query.name, symbol: query.symbol, isActive: query.isActive },
			...paginationOptions,
		})

		return currencies
	}

	async countGetMany(query: CurrencyGetManyRequest) {
		const currenciesCount = await this.prisma.currencyModel.count({
			where: { id: { in: query.ids }, name: query.name, symbol: query.symbol, isActive: query.isActive },
		})

		return currenciesCount
	}

	async getOne(query: CurrencyGetOneRequest) {
		const currency = await this.prisma.currencyModel.findFirst({
			where: { id: query.id, name: query.name, symbol: query.symbol, isActive: query.isActive },
		})

		return currency
	}

	async createOne(body: CurrencyCreateOneRequest) {
		const currency = await this.prisma.currencyModel.create({
			data: {
				name: body.name,
				symbol: body.symbol,
				exchangeRate: body.exchangeRate,
				isActive: body.isActive,
			},
		})

		return currency
	}

	async updateOne(query: CurrencyGetOneRequest, body: CurrencyUpdateOneRequest) {
		const currency = await this.prisma.currencyModel.update({
			where: { id: query.id },
			data: {
				name: body.name,
				symbol: body.symbol,
				exchangeRate: body.exchangeRate,
				isActive: body.isActive,
			},
		})

		return currency
	}

	async deleteOne(query: CurrencyDeleteOneRequest) {
		// const currency = await this.prisma.currencyModel.delete({
		// 	where: { id: query.id },
		// })

		const currency = await this.prisma.currencyModel.update({
			where: { id: query.id },
			data: { deletedAt: new Date() },
		})

		return currency
	}
}
