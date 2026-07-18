import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ClientCreateOneRequest,
	ClientDeleteOneRequest,
	ClientFindManyRequest,
	ClientFindOneRequest,
	ClientGetManyRequest,
	ClientGetOneRequest,
	ClientUpdateOneRequest,
} from './interfaces'
import { PriceTypeEnum, Prisma, SellingStatusEnum } from '@prisma/client'
import { aggregateClientDebtByIds, fetchClientLastSellingDates } from '@common'

/** Ro'yxat uchun yengil select — tarix yuklanmaydi */
const CLIENT_LIST_LIGHT_SELECT = {
	id: true,
	fullname: true,
	phone: true,
	description: true,
	createdAt: true,
	telegram: { select: { id: true, isActive: true } },
} as const

/** `ClientService.calcDebtByCurrency` uchun — `findMany` bilan bir xil ma’lumot */
const CLIENT_DEBT_SOURCE_SELECT = {
	sellings: {
		where: { status: SellingStatusEnum.accepted, deletedAt: null },
		select: {
			date: true,
			description: true,
			products: {
				select: {
					prices: {
						where: { type: PriceTypeEnum.selling },
						select: { totalPrice: true, currencyId: true },
					},
				},
			},
			payment: {
				select: {
					createdAt: true,
					paymentMethods: {
						select: { type: true, amount: true, currencyId: true },
					},
					changeMethods: {
						select: { type: true, amount: true, currencyId: true },
					},
				},
			},
		},
		orderBy: { date: 'desc' as const },
	},
	returnings: {
		where: { status: SellingStatusEnum.accepted, deletedAt: null },
		select: {
			date: true,
			description: true,
			products: {
				select: {
					prices: {
						where: { type: PriceTypeEnum.selling },
						select: { totalPrice: true, currencyId: true },
					},
				},
			},
			payment: {
				select: {
					createdAt: true,
					paymentMethods: {
						select: { type: true, amount: true, currencyId: true },
					},
					changeMethods: {
						select: { type: true, amount: true, currencyId: true },
					},
				},
			},
		},
		orderBy: { date: 'desc' as const },
	},
	payments: {
		where: { deletedAt: null },
		select: {
			createdAt: true,
			paymentMethods: {
				select: { type: true, amount: true, currencyId: true },
			},
			changeMethods: {
				select: { type: true, amount: true, currencyId: true },
			},
		},
	},
} as const

@Injectable()
export class ClientRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	/** `search` bo‘lmasa `OR` + `contains: undefined` Prisma hech nima qaytarmasligi mumkin (masalan selling `findMany` dan `ids` bilan chaqiriq). */
	private buildClientSearchFilter(search?: string): Prisma.ClientModelWhereInput {
		if (!search) return {}
		const words = search.split(/\s+/).filter(Boolean)
		const perWord = (word: string): Prisma.ClientModelWhereInput => ({
			OR: [
				{ fullname: { contains: word, mode: Prisma.QueryMode.insensitive } },
				{ phone: { contains: word, mode: Prisma.QueryMode.insensitive } },
				{ description: { contains: word, mode: Prisma.QueryMode.insensitive } },
			],
		})
		return words.length > 1 ? { AND: words.map(perWord) } : perWord(words[0])
	}

	private clientFindManyWhere(query: ClientFindManyRequest): Prisma.ClientModelWhereInput {
		let idPart: Prisma.ClientModelWhereInput = {}
		if (query.ids?.length) {
			idPart = { id: { in: query.ids } }
		}
		return {
			...idPart,
			...this.buildClientSearchFilter(query.search),
		}
	}

	async findMany(query: ClientFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const clients = await this.prisma.clientModel.findMany({
			where: this.clientFindManyWhere(query),
			select: {
				id: true,
				fullname: true,
				phone: true,
				description: true,
				createdAt: true,
				telegram: { select: { id: true, isActive: true } },
				...CLIENT_DEBT_SOURCE_SELECT,
			},
			...paginationOptions,
		})

		return clients
	}

	async findOne(query: ClientFindOneRequest) {
		const client = await this.prisma.clientModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				fullname: true,
				phone: true,
				description: true,
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
				telegram: { select: { id: true, isActive: true } },
				sellings: {
					where: { status: SellingStatusEnum.accepted, deletedAt: null },
					select: {
						date: true,
						description: true,
						products: {
							select: {
								prices: {
									where: { type: 'selling' },
									select: { totalPrice: true, currencyId: true, currency: true },
								},
							},
						},
						payment: {
							select: {
								createdAt: true,
								description: true,
								paymentMethods: {
									select: { amount: true, currencyId: true, type: true, currency: true },
								},
								changeMethods: {
									select: { amount: true, currencyId: true, type: true, currency: true },
								},
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				returnings: {
					where: { status: SellingStatusEnum.accepted, deletedAt: null },
					select: {
						date: true,
						description: true,
						products: {
							select: {
								prices: {
									where: { type: PriceTypeEnum.selling },
									select: { totalPrice: true, currencyId: true, currency: true },
								},
							},
						},
						payment: {
							select: {
								createdAt: true,
								description: true,
								paymentMethods: {
									select: { amount: true, currencyId: true, type: true, currency: true },
								},
								changeMethods: {
									select: { amount: true, currencyId: true, type: true, currency: true },
								},
							},
						},
					},
				},
				payments: {
					where: { deletedAt: null },
					select: {
						createdAt: true,
						description: true,
						paymentMethods: {
							select: { amount: true, currencyId: true, type: true, currency: true },
						},
						changeMethods: {
							select: { amount: true, currencyId: true, type: true, currency: true },
						},
					},
				},
			},
		})

		return client
	}

	/** Bir nechta mijoz uchun joriy qarz hisoblash ma’lumoti (`ClientService.calcDebtByCurrency`) */
	async findDebtSourcesByClientIds(clientIds: string[]) {
		const unique = [...new Set(clientIds.filter(Boolean))]
		if (unique.length === 0) return []
		return this.prisma.clientModel.findMany({
			where: { id: { in: unique } },
			select: {
				id: true,
				...CLIENT_DEBT_SOURCE_SELECT,
			},
		})
	}

	async countFindMany(query: ClientFindManyRequest) {
		const count = await this.prisma.clientModel.count({
			where: this.clientFindManyWhere(query),
		})

		return count
	}

	/** `GET /client/many-fast` — faqat asosiy maydonlar, pagination DB da */
	async findManyFastLight(query: ClientFindManyRequest) {
		const where = this.clientFindManyWhere(query)
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		return this.prisma.clientModel.findMany({
			where,
			select: CLIENT_LIST_LIGHT_SELECT,
			orderBy: [{ sellings: { _count: 'desc' } }, { createdAt: 'desc' }],
			...paginationOptions,
		})
	}

	async findAllIdsForMany(query: ClientFindManyRequest): Promise<string[]> {
		const rows = await this.prisma.clientModel.findMany({
			where: this.clientFindManyWhere(query),
			select: { id: true },
			orderBy: [{ sellings: { _count: 'desc' } }, { createdAt: 'desc' }],
		})
		return rows.map((r) => r.id)
	}

	async findManyLightByIds(ids: string[]) {
		if (ids.length === 0) return []
		const rows = await this.prisma.clientModel.findMany({
			where: { id: { in: ids } },
			select: CLIENT_LIST_LIGHT_SELECT,
		})
		const byId = new Map(rows.map((r) => [r.id, r]))
		return ids.map((id) => byId.get(id)).filter(Boolean) as typeof rows
	}

	aggregateDebtByClientIds(clientIds: string[]) {
		return aggregateClientDebtByIds(this.prisma, clientIds)
	}

	fetchLastSellingDates(clientIds: string[]) {
		return fetchClientLastSellingDates(this.prisma, clientIds)
	}

	async findManyNew(query: ClientFindManyRequest & { fetchAll?: boolean }) {
		const where = this.clientFindManyWhere(query)
		let paginationOptions = {}
		if (query.pagination && !query.fetchAll) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		return this.prisma.clientModel.findMany({
			where,
			select: {
				id: true,
				fullname: true,
				phone: true,
				description: true,
				createdAt: true,
				telegram: { select: { id: true, isActive: true } },
				...CLIENT_DEBT_SOURCE_SELECT,
			},
			orderBy: [{ sellings: { _count: 'desc' } }, { createdAt: 'desc' }],
			...paginationOptions,
		})
	}

	async countFindManyNew(query: ClientFindManyRequest): Promise<number> {
		return this.prisma.clientModel.count({
			where: this.clientFindManyWhere(query),
		})
	}

	async getMany(query: ClientGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const clients = await this.prisma.clientModel.findMany({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
			},
			...paginationOptions,
		})

		return clients
	}

	async getOne(query: ClientGetOneRequest) {
		const client = await this.prisma.clientModel.findFirst({
			where: { id: query.id, fullname: query.fullname, phone: query.phone },
			select: { id: true, fullname: true, phone: true, createdAt: true, deletedAt: true },
		})

		return client
	}

	async countGetMany(query: ClientGetManyRequest) {
		const count = await this.prisma.clientModel.count({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
			},
		})

		return count
	}

	async createOne(body: ClientCreateOneRequest) {
		const client = await this.prisma.clientModel.create({
			data: {
				fullname: body.fullname,
				phone: body.phone,
				description: body.description,
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				description: true,
				createdAt: true,
			},
		})
		return client
	}

	async updateOne(query: ClientGetOneRequest, body: ClientUpdateOneRequest) {
		const client = await this.prisma.clientModel.update({
			where: { id: query.id },
			data: {
				fullname: body.fullname,
				phone: body.phone,
				description: body.description,
				deletedAt: body.deletedAt,
			},
		})

		return client
	}

	async deleteOne(query: ClientDeleteOneRequest) {
		const client = await this.prisma.clientModel.delete({
			where: { id: query.id },
		})

		return client
	}
}
