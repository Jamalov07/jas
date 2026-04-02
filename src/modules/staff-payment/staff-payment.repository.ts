import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	StaffPaymentCreateOneRequest,
	StaffPaymentDeleteOneRequest,
	StaffPaymentFindManyRequest,
	StaffPaymentFindOneRequest,
	StaffPaymentGetManyRequest,
	StaffPaymentGetOneRequest,
	StaffPaymentUpdateOneRequest,
} from './interfaces'
import { StaffPaymentController } from './staff-payment.controller'
import { ServiceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class StaffPaymentRepository implements OnModuleInit {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: StaffPaymentFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const staffPayments = await this.prisma.paymentModel.findMany({
			where: {
				staffId: query.staffId,
				userId: query.userId,
				type: ServiceTypeEnum.staff,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
			select: {
				id: true,
				user: { select: { id: true, fullname: true, phone: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				sum: true,
				description: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
			...paginationOptions,
		})

		return staffPayments
	}

	async findOne(query: StaffPaymentFindOneRequest) {
		const staffPayment = await this.prisma.paymentModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				user: { select: { id: true, fullname: true, phone: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				sum: true,
				description: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return staffPayment
	}

	async countFindMany(query: StaffPaymentFindManyRequest) {
		const staffPaymentsCount = await this.prisma.paymentModel.count({
			where: {
				staffId: query.staffId,
				userId: query.userId,
				type: ServiceTypeEnum.staff,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
		})

		return staffPaymentsCount
	}

	async getMany(query: StaffPaymentGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const staffPayments = await this.prisma.paymentModel.findMany({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
				type: ServiceTypeEnum.staff,
			},
			...paginationOptions,
		})

		return staffPayments
	}

	async getOne(query: StaffPaymentGetOneRequest) {
		const staffPayment = await this.prisma.paymentModel.findFirst({
			where: { id: query.id, staffId: query.staffId },
			select: { id: true, total: true, user: true, sum: true },
		})

		return staffPayment
	}

	async countGetMany(query: StaffPaymentGetManyRequest) {
		const staffPaymentsCount = await this.prisma.paymentModel.count({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
				type: ServiceTypeEnum.staff,
			},
		})

		return staffPaymentsCount
	}

	async createOne(body: StaffPaymentCreateOneRequest) {
		const staffPayment = await this.prisma.paymentModel.create({
			data: {
				total: body.sum,
				sum: body.sum,
				userId: body.userId,
				staffId: body.staffId,
				description: body.description,
				type: ServiceTypeEnum.staff,
			},
			select: {
				id: true,
				sum: true,
				description: true,
				createdAt: true,
				user: { select: { id: true, fullname: true, phone: true, balance: true } },
			},
		})

		return staffPayment
	}

	async updateOne(query: StaffPaymentGetOneRequest, body: StaffPaymentUpdateOneRequest) {
		const staffPayment = await this.prisma.paymentModel.update({
			where: { id: query.id },
			data: {
				total: body.total,
				sum: body.sum,
				userId: body.userId,
				deletedAt: body.deletedAt,
				description: body.description,
			},
		})

		return staffPayment
	}

	async deleteOne(query: StaffPaymentDeleteOneRequest) {
		const staffPayment = await this.prisma.paymentModel.delete({
			where: { id: query.id },
		})

		return staffPayment
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(StaffPaymentController)
	}
}
