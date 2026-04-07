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
import { SellingStatusEnum } from '@prisma/client'

@Injectable()
export class ClientRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: ClientFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const clients = await this.prisma.clientModel.findMany({
			where: {
				fullname: query.fullname,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				createdAt: true,
				telegram: { select: { id: true, isActive: true } },
				sellings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						date: true,
						products: {
							select: {
								prices: {
									where: { type: 'selling' },
									select: { totalPrice: true, currencyId: true },
								},
							},
						},
						payment: {
							select: {
								methods: {
									select: { type: true, amount: true, currencyId: true },
								},
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					where: { deletedAt: null },
					select: {
						methods: {
							select: { type: true, amount: true, currencyId: true },
						},
					},
				},
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
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
				telegram: { select: { id: true, isActive: true } },
				sellings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						date: true,
						products: {
							select: {
								prices: {
									where: { type: 'selling' },
									select: { totalPrice: true, currencyId: true },
								},
							},
						},
						payment: {
							select: {
								createdAt: true,
								description: true,
								methods: {
									select: { amount: true, currencyId: true, type: true },
								},
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				returnings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						date: true,
						payment: {
							select: {
								createdAt: true,
								description: true,
								methods: {
									select: { amount: true, currencyId: true, type: true },
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
						methods: {
							select: { amount: true, currencyId: true, type: true },
						},
					},
				},
			},
		})

		return client
	}

	async countFindMany(query: ClientFindManyRequest) {
		const count = await this.prisma.clientModel.count({
			where: {
				fullname: query.fullname,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
		})

		return count
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
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
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
