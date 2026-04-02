import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ClientCalc,
	ClientCreateOneRequest,
	ClientDeleteOneRequest,
	ClientFindManyRequest,
	ClientFindOneRequest,
	ClientGetManyRequest,
	ClientGetOneRequest,
	ClientUpdateOneRequest,
} from './interfaces'
import { SellingStatusEnum, ServiceTypeEnum, UserTypeEnum } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { ClientController } from './client.controller'

@Injectable()
export class ClientRepository implements OnModuleInit {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: ClientFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const clients = await this.prisma.userModel.findMany({
			where: {
				fullname: query.fullname,
				type: UserTypeEnum.client,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				balance: true,
				actions: true,
				createdAt: true,
				telegram: true,
				payments: {
					where: { type: ServiceTypeEnum.client, deletedAt: null },
					select: { card: true, cash: true, other: true, transfer: true, total: true },
				},
				sellings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						date: true,
						totalPrice: true,
						payment: { select: { card: true, cash: true, other: true, transfer: true, total: true } },
						products: { select: { count: true, price: true } },
					},
					orderBy: { date: 'desc' },
				},
				returnings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						payment: { select: { fromBalance: true } },
					},
					orderBy: { date: 'desc' },
				},
			},
			...paginationOptions,
		})

		return clients
	}

	async findManyClientForReport(query: ClientFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const clients = await this.prisma.userModel.findMany({
			where: {
				fullname: query.fullname,
				type: UserTypeEnum.client,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				actions: true,
				createdAt: true,
			},
			...paginationOptions,
		})

		return clients
	}

	async findManyStatsForReport2(query: ClientFindManyRequest) {
		const clientMap = new Map<string, ClientCalc>()

		const createEmptyCalc = (): ClientCalc => ({
			selling: {
				count: 0,
				totalPrice: 0,
				payment: {
					count: 0,
					total: 0,
					totalCard: 0,
					totalCash: 0,
					totalTransfer: 0,
					totalOther: 0,
				},
			},
			returning: {
				count: 0,
				totalPrice: 0,
				payment: {
					totalFromBalance: 0,
					totalCash: 0,
				},
			},
		})

		const getClient = (clientId: string) => {
			if (!clientMap.has(clientId)) clientMap.set(clientId, createEmptyCalc())
			return clientMap.get(clientId)
		}

		// --- SELLING STATS ---
		const sellingStats = await this.prisma.sellingModel.groupBy({
			by: ['clientId'],
			where: {
				status: 'accepted',
				...(query.startDate && { date: { gte: query.startDate } }),
				...(query.endDate && { date: { lte: query.endDate } }),
			},
			_count: { clientId: true },
			_sum: { totalPrice: true },
		})

		for (const s of sellingStats) {
			const c = getClient(s.clientId)
			c.selling.count = Number(s._count.clientId)
			c.selling.totalPrice = Number(s._sum.totalPrice ?? 0)
		}

		// --- PAYMENT STATS ---
		const paymentStats = await this.prisma.paymentModel.groupBy({
			by: ['userId'],
			where: {
				type: { in: ['client', 'selling'] },
				deletedAt: null,
				total: { gt: 0 },
				...(query.startDate && { createdAt: { gte: query.startDate } }),
				...(query.endDate && { createdAt: { lte: query.endDate } }),
			},
			_count: { userId: true },
			_sum: { total: true, cash: true, card: true, transfer: true, other: true },
		})

		for (const p of paymentStats) {
			const c = getClient(p.userId)
			c.selling.payment.count = Number(p._count.userId)
			c.selling.payment.total = Number(p._sum.total ?? 0)
			c.selling.payment.totalCash = Number(p._sum.cash ?? 0)
			c.selling.payment.totalCard = Number(p._sum.card ?? 0)
			c.selling.payment.totalTransfer = Number(p._sum.transfer ?? 0)
			c.selling.payment.totalOther = Number(p._sum.other ?? 0)
		}

		// --- RETURNING STATS ---
		const returningStats = await this.prisma.returningModel.findMany({
			where: {
				status: 'accepted',
				...(query.startDate && { date: { gte: query.startDate } }),
				...(query.endDate && { date: { lte: query.endDate } }),
			},
			include: { payment: { select: { fromBalance: true, cash: true } } },
		})

		for (const r of returningStats) {
			const c = getClient(r.clientId)
			c.returning.count += 1
			c.returning.totalPrice += Number(r.totalPrice ?? 0)
			c.returning.payment.totalFromBalance += Number(r.payment?.fromBalance ?? 0)
			c.returning.payment.totalCash += Number(r.payment?.cash ?? 0)
		}

		return Object.fromEntries(clientMap)
	}

	async findOne(query: ClientFindOneRequest) {
		const client = await this.prisma.userModel.findFirst({
			where: { id: query.id, type: UserTypeEnum.client },
			select: {
				id: true,
				fullname: true,
				balance: true,
				phone: true,
				actions: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				payments: {
					where: { type: ServiceTypeEnum.client, deletedAt: null },
					select: { card: true, total: true, cash: true, other: true, transfer: true, createdAt: true, description: true },
				},
				sellings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						date: true,
						totalPrice: true,
						products: { select: { cost: true, count: true, price: true } },
						payment: {
							select: { total: true, card: true, cash: true, other: true, transfer: true, createdAt: true, description: true },
						},
					},
					orderBy: { date: 'desc' },
				},
				returnings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						payment: {
							select: { fromBalance: true, createdAt: true, description: true },
						},
					},
				},
				telegram: true,
			},
		})

		return client
	}

	async countFindMany(query: ClientFindManyRequest) {
		const clientsCount = await this.prisma.userModel.count({
			where: {
				fullname: query.fullname,
				type: UserTypeEnum.client,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
		})

		return clientsCount
	}

	async getMany(query: ClientGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const clients = await this.prisma.userModel.findMany({
			where: {
				id: { in: query.ids },
				type: UserTypeEnum.client,
				fullname: query.fullname,
			},
			...paginationOptions,
		})

		return clients
	}

	async getOne(query: ClientGetOneRequest) {
		const client = await this.prisma.userModel.findFirst({
			where: { id: query.id, fullname: query.fullname, phone: query.phone },
			select: { id: true, fullname: true, phone: true, createdAt: true, deletedAt: true, password: true, token: true },
		})

		return client
	}

	async countGetMany(query: ClientGetManyRequest) {
		const clientsCount = await this.prisma.userModel.count({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
				type: UserTypeEnum.client,
			},
		})

		return clientsCount
	}

	async createOne(body: ClientCreateOneRequest) {
		const password = await bcrypt.hash(body.phone, 7)

		const client = await this.prisma.userModel.create({
			data: {
				fullname: body.fullname,
				password: password,
				phone: body.phone,
				type: UserTypeEnum.client,
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
		const client = await this.prisma.userModel.update({
			where: { id: query.id },
			data: {
				fullname: body.fullname,
				phone: body.phone,
				balance: body.balance,
				deletedAt: body.deletedAt,
			},
		})

		return client
	}

	async deleteOne(query: ClientDeleteOneRequest) {
		const client = await this.prisma.userModel.delete({
			where: { id: query.id },
		})

		return client
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(ClientController)
	}
}
