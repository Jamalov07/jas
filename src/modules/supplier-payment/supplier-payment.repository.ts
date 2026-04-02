import { Injectable, OnModuleInit } from '@nestjs/common'
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
import { SupplierPaymentController } from './supplier-payment.controller'
import { ServiceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class SupplierPaymentRepository implements OnModuleInit {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: SupplierPaymentFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const supplierPayments = await this.prisma.paymentModel.findMany({
			where: {
				staffId: query.staffId,
				userId: query.userId,
				type: { in: [ServiceTypeEnum.supplier, ServiceTypeEnum.arrival] },
				OR: [{ user: { fullname: { contains: query.search, mode: 'insensitive' } } }, { user: { phone: { contains: query.search, mode: 'insensitive' } } }],
				createdAt: { gte: query.startDate, lte: query.endDate },
				NOT: { AND: [{ card: 0 }, { cash: 0 }, { transfer: 0 }, { other: 0 }] },
			},
			select: {
				id: true,
				user: { select: { id: true, fullname: true, phone: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				card: true,
				cash: true,
				description: true,
				other: true,
				transfer: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
			...paginationOptions,
		})

		return supplierPayments
	}

	async findOne(query: SupplierPaymentFindOneRequest) {
		const supplierPayment = await this.prisma.paymentModel.findFirst({
			where: {
				id: query.id,
				type: { in: [ServiceTypeEnum.supplier, ServiceTypeEnum.arrival] },
				NOT: { AND: [{ card: 0 }, { cash: 0 }, { transfer: 0 }, { other: 0 }] },
			},
			select: {
				id: true,
				user: { select: { id: true, fullname: true, phone: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				card: true,
				cash: true,
				description: true,
				other: true,
				transfer: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return supplierPayment
	}

	async countFindMany(query: SupplierPaymentFindManyRequest) {
		const supplierPaymentsCount = await this.prisma.paymentModel.count({
			where: {
				staffId: query.staffId,
				userId: query.userId,
				type: { in: [ServiceTypeEnum.supplier, ServiceTypeEnum.arrival] },
				OR: [{ user: { fullname: { contains: query.search, mode: 'insensitive' } } }, { user: { phone: { contains: query.search, mode: 'insensitive' } } }],
				createdAt: { gte: query.startDate, lte: query.endDate },
				NOT: { AND: [{ card: 0 }, { cash: 0 }, { transfer: 0 }, { other: 0 }] },
			},
		})

		return supplierPaymentsCount
	}

	async getMany(query: SupplierPaymentGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const supplierPayments = await this.prisma.paymentModel.findMany({
			where: {
				id: { in: query.ids },
				type: { in: [ServiceTypeEnum.supplier, ServiceTypeEnum.arrival] },
				staffId: query.staffId,
			},
			...paginationOptions,
		})

		return supplierPayments
	}

	async getOne(query: SupplierPaymentGetOneRequest) {
		const supplierPayment = await this.prisma.paymentModel.findFirst({
			where: { id: query.id, staffId: query.staffId },
			select: { id: true, user: true, total: true, type: true },
		})

		return supplierPayment
	}

	async countGetMany(query: SupplierPaymentGetManyRequest) {
		const supplierPaymentsCount = await this.prisma.paymentModel.count({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
				type: { in: [ServiceTypeEnum.supplier, ServiceTypeEnum.arrival] },
			},
		})

		return supplierPaymentsCount
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
		const supplierPayment = await this.prisma.paymentModel.create({
			data: {
				total: body.total,
				card: body.card,
				cash: body.cash,
				other: body.other,
				transfer: body.transfer,
				userId: body.userId,
				staffId: body.staffId,
				description: body.description,
				type: ServiceTypeEnum.supplier,
				createdAt: dayClose ? date : undefined,
			},
			select: {
				id: true,
				user: { select: { id: true, fullname: true, phone: true, balance: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				card: true,
				cash: true,
				description: true,
				other: true,
				transfer: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return supplierPayment
	}

	async updateOne(query: SupplierPaymentGetOneRequest, body: SupplierPaymentUpdateOneRequest) {
		const supplierPayment = await this.prisma.paymentModel.update({
			where: { id: query.id },
			data: {
				card: body.card,
				cash: body.cash,
				other: body.other,
				transfer: body.transfer,
				userId: body.userId,
				description: body.description,
				total: body.total,
			},
			select: {
				id: true,
				userId: true,
				card: true,
				cash: true,
				other: true,
				transfer: true,
				total: true,
				user: { select: { id: true, fullname: true, phone: true } },
			},
		})

		return supplierPayment
	}

	async deleteOne(query: SupplierPaymentDeleteOneRequest) {
		const supplierPayment = await this.prisma.paymentModel.delete({
			where: { id: query.id },
		})

		return supplierPayment
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(SupplierPaymentController)
	}
}
