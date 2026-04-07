import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ClientPaymentCreateOneRequest,
	ClientPaymentDeleteOneRequest,
	ClientPaymentFindManyRequest,
	ClientPaymentFindOneRequest,
	ClientPaymentGetManyRequest,
	ClientPaymentGetOneRequest,
	ClientPaymentUpdateOneRequest,
} from './interfaces'
@Injectable()
export class ClientPaymentRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	private paymentMethodsSelect = {
		id: true,
		type: true,
		currencyId: true,
		amount: true,
		currency: { select: { id: true, symbol: true } },
	}

	async findMany(query: ClientPaymentFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const payments = await this.prisma.clientPaymentModel.findMany({
			where: {
				staffId: query.staffId,
				clientId: query.clientId,
				deletedAt: null,
				OR: query.search
					? [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }]
					: undefined,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
			select: {
				id: true,
				staff: { select: { id: true, fullname: true, phone: true } },
				client: { select: { id: true, fullname: true, phone: true } },
				description: true,
				methods: { select: this.paymentMethodsSelect },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
			...paginationOptions,
		})

		return payments
	}

	async findOne(query: ClientPaymentFindOneRequest) {
		const payment = await this.prisma.clientPaymentModel.findFirst({
			where: { id: query.id, deletedAt: null },
			select: {
				id: true,
				staff: { select: { id: true, fullname: true, phone: true } },
				client: { select: { id: true, fullname: true, phone: true } },
				description: true,
				methods: { select: this.paymentMethodsSelect },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return payment
	}

	async countFindMany(query: ClientPaymentFindManyRequest) {
		const count = await this.prisma.clientPaymentModel.count({
			where: {
				staffId: query.staffId,
				clientId: query.clientId,
				deletedAt: null,
				OR: query.search
					? [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }]
					: undefined,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
		})

		return count
	}

	async getMany(query: ClientPaymentGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const payments = await this.prisma.clientPaymentModel.findMany({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
			},
			...paginationOptions,
		})

		return payments
	}

	async getOne(query: ClientPaymentGetOneRequest) {
		const payment = await this.prisma.clientPaymentModel.findFirst({
			where: { id: query.id, staffId: query.staffId },
			select: {
				id: true,
				clientId: true,
				client: true,
				methods: { select: this.paymentMethodsSelect },
			},
		})

		return payment
	}

	async countGetMany(query: ClientPaymentGetManyRequest) {
		const count = await this.prisma.clientPaymentModel.count({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
			},
		})

		return count
	}

	async createOne(body: ClientPaymentCreateOneRequest) {
		const today = new Date()
		const dayClose = await this.prisma.dayCloseLog.findFirst({ where: { closedDate: today } })
		let date = new Date()

		if (dayClose) {
			const tomorrow = new Date(today)
			tomorrow.setDate(today.getDate() + 1)
			tomorrow.setHours(0, 0, 0, 0)
			date = tomorrow
		}

		const payment = await this.prisma.clientPaymentModel.create({
			data: {
				clientId: body.clientId,
				staffId: body.staffId,
				description: body.description,
				createdAt: dayClose ? date : undefined,
				methods: {
					create: body.paymentMethods.map((m) => ({
						type: m.type as any,
						currencyId: m.currencyId,
						amount: m.amount,
					})),
				},
			},
			select: {
				id: true,
				staff: { select: { id: true, fullname: true, phone: true } },
				client: { select: { id: true, fullname: true, phone: true } },
				description: true,
				methods: { select: this.paymentMethodsSelect },
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
			},
		})

		return payment
	}

	async updateOne(query: ClientPaymentGetOneRequest, body: ClientPaymentUpdateOneRequest) {
		const payment = await this.prisma.clientPaymentModel.update({
			where: { id: query.id },
			data: {
				clientId: body.clientId,
				description: body.description,
				deletedAt: body.deletedAt,
				...(body.paymentMethods
					? {
							methods: {
								deleteMany: {},
								create: body.paymentMethods.map((m) => ({
									type: m.type as any,
									currencyId: m.currencyId,
									amount: m.amount,
								})),
							},
						}
					: {}),
			},
			select: {
				id: true,
				clientId: true,
				client: { select: { id: true, fullname: true, phone: true } },
				methods: { select: this.paymentMethodsSelect },
				createdAt: true,
			},
		})

		return payment
	}

	async deleteOne(query: ClientPaymentDeleteOneRequest) {
		await this.prisma.clientPaymentModel.delete({
			where: { id: query.id },
		})
	}
}
