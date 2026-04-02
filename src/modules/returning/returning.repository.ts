import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ReturningCreateOneRequest,
	ReturningDeleteOneRequest,
	ReturningFindManyRequest,
	ReturningFindOneRequest,
	ReturningGetManyRequest,
	ReturningGetOneRequest,
	ReturningUpdateOneRequest,
} from './interfaces'
import { ReturningController } from './returning.controller'
import { SellingStatusEnum, ServiceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

@Injectable()
export class ReturningRepository implements OnModuleInit {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: ReturningFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const returnings = await this.prisma.returningModel.findMany({
			where: {
				status: query.status,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
			select: {
				id: true,
				status: true,
				totalPrice: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				client: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { id: true, cash: true, fromBalance: true, total: true } },
				products: { orderBy: [{ createdAt: 'desc' }], select: { id: true, price: true, count: true, product: { select: { name: true } } } },
			},
			...paginationOptions,
		})

		return returnings
	}

	async findOne(query: ReturningFindOneRequest) {
		const returning = await this.prisma.returningModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				status: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				client: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { total: true, id: true, cash: true, fromBalance: true } },
				products: { orderBy: [{ createdAt: 'desc' }], select: { id: true, price: true, count: true, product: { select: { name: true } } } },
			},
		})

		return returning
	}

	async countFindMany(query: ReturningFindManyRequest) {
		const returningsCount = await this.prisma.returningModel.count({
			where: {
				status: query.status,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
		})

		return returningsCount
	}

	async getMany(query: ReturningGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const returnings = await this.prisma.returningModel.findMany({
			where: {
				id: { in: query.ids },
				clientId: query.clientId,
				status: query.status,
			},
			...paginationOptions,
		})

		return returnings
	}

	async getOne(query: ReturningGetOneRequest) {
		const returning = await this.prisma.returningModel.findFirst({
			where: { id: query.id, clientId: query.clientId, staffId: query.staffId, status: query.status },
			select: { id: true, payment: true, staffId: true, status: true },
		})

		return returning
	}

	async countGetMany(query: ReturningGetManyRequest) {
		const returningsCount = await this.prisma.returningModel.count({
			where: {
				id: { in: query.ids },
				clientId: query.clientId,
				status: query.status,
			},
		})

		return returningsCount
	}

	async createOne(body: ReturningCreateOneRequest) {
		const today = new Date()
		const dayClose = await this.prisma.dayCloseLog.findFirst({ where: { closedDate: today } })

		if (dayClose) {
			const tomorrow = new Date(today)
			tomorrow.setDate(today.getDate() + 1)
			tomorrow.setHours(0, 0, 0, 0)

			body.date = tomorrow
		}
		const returning = await this.prisma.returningModel.create({
			data: {
				status: body.status,
				clientId: body.clientId,
				date: new Date(body.date),
				createdAt: dayClose ? body.date : undefined,
				staffId: body.staffId,
				totalPrice: body.totalPrice,
				payment: {
					create: {
						total: body.payment.total,
						cash: body.payment?.cash,
						fromBalance: body.payment?.fromBalance,
						userId: body.clientId,
						staffId: body.staffId,
						type: ServiceTypeEnum.returning,
						createdAt: dayClose ? body.date : undefined,
					},
				},
				products: {
					createMany: {
						skipDuplicates: false,
						data: body.products
							? body.products?.map((p) => ({
									productId: p.productId,
									type: ServiceTypeEnum.returning,
									count: p.count,
									price: p.price,
									totalPrice: p.totalPrice,
									staffId: body.staffId,
									createdAt: dayClose ? body.date : undefined,
								}))
							: [],
					},
				},
			},
			select: {
				id: true,
				status: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				client: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { id: true, cash: true, fromBalance: true } },
				products: { select: { id: true, price: true, count: true, product: { select: { name: true } } } },
			},
		})

		if (body.status === SellingStatusEnum.accepted && body.products?.length) {
			// Barcha mahsulotlarni birdaniga olish
			const existingProducts = await this.prisma.productModel.findMany({
				where: { id: { in: body.products.map((p) => p.productId) } },
				select: { id: true },
			})

			const existingProductIds = new Set(existingProducts.map((p) => p.id))

			await Promise.all(
				body.products
					.filter((p) => existingProductIds.has(p.productId))
					.map((product) =>
						this.prisma.productModel.update({
							where: { id: product.productId },
							data: { count: { increment: product.count } },
						}),
					),
			)
		}

		return returning
	}

	async updateOne(query: ReturningGetOneRequest, body: ReturningUpdateOneRequest) {
		const existReturning = await this.findOne(query)

		const returning = await this.prisma.returningModel.update({
			where: { id: query.id },
			data: {
				date: body.date ? new Date(body.date) : undefined,
				status: body.status,
				clientId: body.clientId,
				totalPrice: body.totalPrice,
				deletedAt: body.deletedAt,
				payment: {
					update: {
						total: body.payment.total,
						cash: body.payment?.cash,
						fromBalance: body.payment?.fromBalance,
						createdAt: existReturning.payment.total ? undefined : new Date(),
					},
				},
			},
			select: {
				id: true,
				status: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				client: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { id: true, cash: true, fromBalance: true } },
				products: { select: { id: true, price: true, count: true, product: { select: { id: true, name: true } } } },
			},
		})

		await this.prisma.returningModel.update({
			where: { id: returning.id },
			data: { payment: { update: { total: returning.payment.cash.plus(returning.payment.fromBalance) } } },
		})

		if (body.status === SellingStatusEnum.accepted && existReturning.status !== SellingStatusEnum.accepted) {
			if (returning.products) {
				for (const product of returning.products) {
					const pr = await this.prisma.productModel.findFirst({ where: { id: product.product.id } })
					if (pr) {
						await this.prisma.productModel.update({
							where: { id: product.product.id },
							data: { count: { increment: product.count } },
						})
					}
				}
			}
		}

		return returning
	}

	async deleteOne(query: ReturningDeleteOneRequest) {
		const returning = await this.prisma.returningModel.delete({
			where: { id: query.id },
			select: { products: { select: { product: true, count: true } }, status: true },
		})

		if (returning.status === SellingStatusEnum.accepted) {
			for (const product of returning.products) {
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
			}
		}

		return returning
	}

	async findManyReturningProductMv(ids: string[]) {
		const productmvs = await this.prisma.productMVModel.findMany({
			where: { id: { in: ids }, type: ServiceTypeEnum.returning },
			select: {
				id: true,
				price: true,
				cost: true,
				count: true,
				product: true,
			},
		})

		return productmvs
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(ReturningController)
	}
}
