import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
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

	private methodLineSelect = {
		id: true,
		type: true,
		currencyId: true,
		amount: true,
		currency: { select: { id: true, name: true, symbol: true } },
	}

	private findManySharedWhere(query: ClientPaymentFindManyRequest): Prisma.ClientPaymentModelWhereInput {
		return {
			staffId: query.staffId,
			clientId: query.clientId,
			deletedAt: null,
			OR: query.search
				? [
						{ client: { fullname: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
						{ client: { phone: { contains: query.search, mode: Prisma.QueryMode.insensitive } } },
					]
				: undefined,
			createdAt: { gte: query.startDate, lte: query.endDate },
		}
	}

	private findManyRowSelect = {
		id: true,
		staff: { select: { id: true, fullname: true, phone: true } },
		client: { select: { id: true, fullname: true, phone: true } },
		description: true,
		paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
		changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
		updatedAt: true,
		createdAt: true,
		deletedAt: true,
	}

	async findMany(query: ClientPaymentFindManyRequest) {
		const where = this.findManySharedWhere(query)
		const sellingWhere = where as Prisma.ClientSellingPaymentModelWhereInput

		const [standalone, sellingLinked] = await Promise.all([
			this.prisma.clientPaymentModel.findMany({
				where,
				select: this.findManyRowSelect,
			}),
			this.prisma.clientSellingPaymentModel.findMany({
				where: sellingWhere,
				select: {
					...this.findManyRowSelect,
					sellingId: true,
				},
			}),
		])

		const merged = [...standalone.map((p) => ({ ...p, paymentSource: 'standalone' as const })), ...sellingLinked.map((p) => ({ ...p, paymentSource: 'selling' as const }))].sort(
			(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		)

		if (query.pagination) {
			const skip = (query.pageNumber - 1) * query.pageSize
			return merged.slice(skip, skip + query.pageSize)
		}

		return merged
	}

	async findOne(query: ClientPaymentFindOneRequest) {
		const payment = await this.prisma.clientPaymentModel.findFirst({
			where: { id: query.id, deletedAt: null },
			select: {
				id: true,
				staff: { select: { id: true, fullname: true, phone: true } },
				client: { select: { id: true, fullname: true, phone: true } },
				description: true,
				paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
				changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return payment
	}

	async countFindMany(query: ClientPaymentFindManyRequest) {
		const where = this.findManySharedWhere(query)
		const sellingWhere = where as Prisma.ClientSellingPaymentModelWhereInput
		const [cStandalone, cSelling] = await Promise.all([this.prisma.clientPaymentModel.count({ where }), this.prisma.clientSellingPaymentModel.count({ where: sellingWhere })])
		return cStandalone + cSelling
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
			include: {
				staff: { select: { id: true, fullname: true, phone: true } },
				client: { select: { id: true, fullname: true, phone: true } },
				paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
				changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
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
				paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
				changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
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
				paymentMethods: {
					create: body.paymentMethods.map((m) => ({
						type: m.type as any,
						currencyId: m.currencyId,
						amount: m.amount,
					})),
				},
				...(body.changeMethods?.length && {
					changeMethods: {
						create: body.changeMethods.map((m) => ({
							type: m.type as any,
							currencyId: m.currencyId,
							amount: m.amount,
						})),
					},
				}),
			},
			select: {
				id: true,
				staff: { select: { id: true, fullname: true, phone: true } },
				client: { select: { id: true, fullname: true, phone: true } },
				description: true,
				paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
				changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
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
				...(body.paymentMethods !== undefined && {
					paymentMethods: {
						deleteMany: {},
						create: body.paymentMethods.map((m) => ({
							type: m.type as any,
							currencyId: m.currencyId,
							amount: m.amount,
						})),
					},
				}),
				...(body.changeMethods !== undefined && {
					changeMethods: {
						deleteMany: {},
						create: body.changeMethods.map((m) => ({
							type: m.type as any,
							currencyId: m.currencyId,
							amount: m.amount,
						})),
					},
				}),
			},
			select: {
				id: true,
				clientId: true,
				client: { select: { id: true, fullname: true, phone: true } },
				paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
				changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: this.methodLineSelect },
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
