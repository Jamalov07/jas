import { Injectable } from '@nestjs/common'
import { Decimal } from '@prisma/client/runtime/library'
import { PrismaService } from '../shared'
import {
	CurrencyCreateOneRequest,
	CurrencyDeleteOneRequest,
	CurrencyFindManyRequest,
	CurrencyFindOneRequest,
	CurrencyFindOneData,
	CurrencyGetManyRequest,
	CurrencyGetOneRequest,
	CurrencyUpdateOneRequest,
} from './interfaces'

/** Valyuta ma'lumotlari kamdan-kam o'zgaradi — 60 soniyalik TTL kesh juda ko'p DB round-tripni kamaytiradi */
const CACHE_TTL_MS = 60_000

interface CacheEntry<T> {
	value: T
	expiresAt: number
}

@Injectable()
export class CurrencyRepository {
	private readonly prisma: PrismaService
	private readonly _cache = new Map<string, CacheEntry<unknown>>()

	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	private _get<T>(key: string): T | undefined {
		const entry = this._cache.get(key)
		if (!entry) return undefined
		if (Date.now() > entry.expiresAt) {
			this._cache.delete(key)
			return undefined
		}
		return entry.value as T
	}

	private _set<T>(key: string, value: T): void {
		this._cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
	}

	/** Currency yozilganda (create/update/delete) kesh tozalanadi */
	private _invalidate(): void {
		this._cache.clear()
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
				deletedAt: null,
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
		const cached = this._get<string[]>('activeIds')
		if (cached) return cached
		const rows = await this.prisma.currencyModel.findMany({
			where: { isActive: true, deletedAt: null },
			select: { id: true },
			orderBy: { name: 'asc' },
		})
		const result = rows.map((r) => r.id)
		this._set('activeIds', result)
		return result
	}

	/** Bitta so'rov: aktiv valyutalar (`ProductPriceData.currency` uchun `CurrencyFindOneData`). */
	async findActiveBriefOrdered(): Promise<CurrencyFindOneData[]> {
		const cached = this._get<CurrencyFindOneData[]>('activeBriefOrdered')
		if (cached) return cached
		const rows = await this.prisma.currencyModel.findMany({
			where: { isActive: true, deletedAt: null },
			select: { id: true, name: true, symbol: true, isActive: true, exchangeRate: true, createdAt: true },
			orderBy: { name: 'asc' },
		})
		const result = rows.map((r) => ({ ...r, exchangeRate: r.exchangeRate ?? new Decimal(0) }))
		this._set('activeBriefOrdered', result)
		return result
	}

	async findExchangeRatesAndSymbolsByIds(ids: string[]): Promise<{ rates: Map<string, Decimal>; symbols: Map<string, string> }> {
		const unique = [...new Set(ids.filter(Boolean))].sort()
		if (unique.length === 0) return { rates: new Map(), symbols: new Map() }
		const cacheKey = `rates:${unique.join(',')}`
		const cached = this._get<{ rates: Map<string, Decimal>; symbols: Map<string, string> }>(cacheKey)
		if (cached) return cached
		const rows = await this.prisma.currencyModel.findMany({
			where: { id: { in: unique } },
			select: { id: true, exchangeRate: true, symbol: true },
		})
		const rates = new Map<string, Decimal>()
		const symbols = new Map<string, string>()
		for (const r of rows) {
			rates.set(r.id, r.exchangeRate ?? new Decimal(0))
			symbols.set(r.id, r.symbol)
		}
		const result = { rates, symbols }
		this._set(cacheKey, result)
		return result
	}

	async findBriefByIds(ids: string[]): Promise<Array<{ id: string; name: string; symbol: string }>> {
		const unique = [...new Set(ids.filter(Boolean))].sort()
		if (unique.length === 0) return []
		const cacheKey = `brief:${unique.join(',')}`
		const cached = this._get<Array<{ id: string; name: string; symbol: string }>>(cacheKey)
		if (cached) return cached
		const result = await this.prisma.currencyModel.findMany({
			where: { id: { in: unique } },
			select: { id: true, name: true, symbol: true },
		})
		this._set(cacheKey, result)
		return result
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
		this._invalidate()
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
		this._invalidate()
		return currency
	}

	async deleteOne(query: CurrencyDeleteOneRequest) {
		const currency = await this.prisma.currencyModel.update({
			where: { id: query.id },
			data: { deletedAt: new Date() },
		})
		this._invalidate()
		return currency
	}
}
