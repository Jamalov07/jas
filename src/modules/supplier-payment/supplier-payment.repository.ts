import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	SupplierPaymentCreateOneRequest,
	SupplierPaymentDeleteOneRequest,
	SupplierPaymentFindManyRequest,
	SupplierPaymentFindOneRequest,
	SupplierPaymentGetManyRequest,
	SupplierPaymentGetOneRequest,
	SupplierPaymentUpdateOneRequest,
} from './interfaces'
@Injectable()
export class SupplierPaymentRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: SupplierPaymentFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const payments = await this.prisma.supplierPaymentModel.findMany({
			where: {
				staffId: query.staffId,
				supplierId: query.supplierId,
				deletedAt: null,
				OR: query.search
					? [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }]
					: undefined,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
			select: {
				id: true,
				staff: { select: { id: true, fullname: true, phone: true } },
				supplier: { select: { id: true, fullname: true, phone: true } },
				description: true,
				methods: {
					select: {
						id: true,
						type: true,
						currencyId: true,
						amount: true,
						currency: { select: { id: true, symbol: true } },
					},
				},
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
			...paginationOptions,
		})

		return payments
	}

	async findOne(query: SupplierPaymentFindOneRequest) {
		const payment = await this.prisma.supplierPaymentModel.findFirst({
			where: { id: query.id, deletedAt: null },
			select: {
				id: true,
				staff: { select: { id: true, fullname: true, phone: true } },
				supplier: { select: { id: true, fullname: true, phone: true } },
				description: true,
				methods: {
					select: {
						id: true,
						type: true,
						currencyId: true,
						amount: true,
						currency: { select: { id: true, symbol: true } },
					},
				},
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return payment
	}

	async countFindMany(query: SupplierPaymentFindManyRequest) {
		const count = await this.prisma.supplierPaymentModel.count({
			where: {
				staffId: query.staffId,
				supplierId: query.supplierId,
				deletedAt: null,
				OR: query.search
					? [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }]
					: undefined,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
		})

		return count
	}

	async getMany(query: SupplierPaymentGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const payments = await this.prisma.supplierPaymentModel.findMany({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
			},
			include: {
				methods: {
					select: {
						id: true,
						type: true,
						currencyId: true,
						amount: true,
						currency: { select: { id: true, symbol: true } },
					},
				},
			},
			...paginationOptions,
		})

		return payments
	}

	async getOne(query: SupplierPaymentGetOneRequest) {
		const payment = await this.prisma.supplierPaymentModel.findFirst({
			where: { id: query.id, staffId: query.staffId },
			select: {
				id: true,
				supplierId: true,
				supplier: true,
				methods: {
					select: {
						id: true,
						type: true,
						currencyId: true,
						amount: true,
						currency: { select: { id: true, symbol: true } },
					},
				},
			},
		})

		return payment
	}

	async countGetMany(query: SupplierPaymentGetManyRequest) {
		const count = await this.prisma.supplierPaymentModel.count({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
			},
		})

		return count
	}

	async createOne(body: SupplierPaymentCreateOneRequest) {
		const today = new Date()
		const dayClose = await this.prisma.dayCloseLog.findFirst({ where: { closedDate: today } })
		let date = new Date()

		if (dayClose) {
			const tomorrow = new Date(today)
			tomorrow.setDate(today.getDate() + 1)
			tomorrow.setHours(0, 0, 0, 0)
			date = tomorrow
		}

		const payment = await this.prisma.supplierPaymentModel.create({
			data: {
				supplierId: body.supplierId,
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
				supplier: { select: { id: true, fullname: true, phone: true } },
				description: true,
				methods: {
					select: {
						id: true,
						type: true,
						currencyId: true,
						amount: true,
						currency: { select: { id: true, symbol: true } },
					},
				},
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
			},
		})

		return payment
	}

	async updateOne(query: SupplierPaymentGetOneRequest, body: SupplierPaymentUpdateOneRequest) {
		const payment = await this.prisma.supplierPaymentModel.update({
			where: { id: query.id },
			data: {
				supplierId: body.supplierId,
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
				supplierId: true,
				supplier: { select: { id: true, fullname: true, phone: true } },
				methods: {
					select: {
						id: true,
						type: true,
						currencyId: true,
						amount: true,
						currency: { select: { id: true, symbol: true } },
					},
				},
				createdAt: true,
			},
		})

		return payment
	}

	async deleteOne(query: SupplierPaymentDeleteOneRequest) {
		await this.prisma.supplierPaymentModel.delete({
			where: { id: query.id },
		})
	}
}
