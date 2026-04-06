import { Injectable } from '@nestjs/common'
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
@Injectable()
export class StaffPaymentRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	private paymentMethodsSelect = {
		id: true,
		type: true,
		currencyId: true,
		amount: true,
	}

	async findMany(query: StaffPaymentFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const payments = await this.prisma.staffPaymentModel.findMany({
			where: {
				staffId: query.staffId,
				employeeId: query.employeeId,
				deletedAt: null,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
			select: {
				id: true,
				employee: { select: { id: true, fullname: true, phone: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				description: true,
				employeePaymentMethods: { select: this.paymentMethodsSelect },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
			...paginationOptions,
		})

		return payments
	}

	async findOne(query: StaffPaymentFindOneRequest) {
		const payment = await this.prisma.staffPaymentModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				employee: { select: { id: true, fullname: true, phone: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				description: true,
				employeePaymentMethods: { select: this.paymentMethodsSelect },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return payment
	}

	async countFindMany(query: StaffPaymentFindManyRequest) {
		const count = await this.prisma.staffPaymentModel.count({
			where: {
				staffId: query.staffId,
				employeeId: query.employeeId,
				deletedAt: null,
				createdAt: { gte: query.startDate, lte: query.endDate },
			},
		})

		return count
	}

	async getMany(query: StaffPaymentGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const payments = await this.prisma.staffPaymentModel.findMany({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
			},
			...paginationOptions,
		})

		return payments
	}

	async getOne(query: StaffPaymentGetOneRequest) {
		const payment = await this.prisma.staffPaymentModel.findFirst({
			where: { id: query.id, staffId: query.staffId },
			select: {
				id: true,
				employeeId: true,
				employee: true,
				employeePaymentMethods: { select: this.paymentMethodsSelect },
			},
		})

		return payment
	}

	async countGetMany(query: StaffPaymentGetManyRequest) {
		const count = await this.prisma.staffPaymentModel.count({
			where: {
				id: { in: query.ids },
				staffId: query.staffId,
			},
		})

		return count
	}

	async createOne(body: StaffPaymentCreateOneRequest) {
		const payment = await this.prisma.staffPaymentModel.create({
			data: {
				employeeId: body.employeeId,
				staffId: body.staffId,
				description: body.description,
				employeePaymentMethods: {
					create: body.paymentMethods.map((m) => ({
						type: m.type as any,
						currencyId: m.currencyId,
						amount: m.amount,
					})),
				},
			},
			select: {
				id: true,
				employee: { select: { id: true, fullname: true, phone: true } },
				staff: { select: { id: true, fullname: true, phone: true } },
				description: true,
				employeePaymentMethods: { select: this.paymentMethodsSelect },
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
			},
		})

		return payment
	}

	async updateOne(query: StaffPaymentGetOneRequest, body: StaffPaymentUpdateOneRequest) {
		const payment = await this.prisma.staffPaymentModel.update({
			where: { id: query.id },
			data: {
				employeeId: body.employeeId,
				description: body.description,
				deletedAt: body.deletedAt,
				...(body.paymentMethods
					? {
							employeePaymentMethods: {
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
				employeeId: true,
				employee: { select: { id: true, fullname: true, phone: true } },
				employeePaymentMethods: { select: this.paymentMethodsSelect },
				createdAt: true,
			},
		})

		return payment
	}

	async deleteOne(query: StaffPaymentDeleteOneRequest) {
		await this.prisma.staffPaymentModel.delete({
			where: { id: query.id },
		})
	}

}
