import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ArrivalCreateOneRequest,
	ArrivalDeleteOneRequest,
	ArrivalFindManyRequest,
	ArrivalFindOneRequest,
	ArrivalGetManyRequest,
	ArrivalGetOneRequest,
	ArrivalUpdateOneRequest,
} from './interfaces'
import { ArrivalController } from './arrival.controller'
import { ServiceTypeEnum } from '@prisma/client'

@Injectable()
export class ArrivalRepository implements OnModuleInit {
	constructor(private readonly prisma: PrismaService) {}

	async findMany(query: ArrivalFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const arrivals = await this.prisma.arrivalModel.findMany({
			where: {
				supplierId: query.supplierId,
				OR: [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
			select: {
				id: true,
				date: true,
				totalCost: true,
				totalPrice: true,
				supplier: { select: { fullname: true, phone: true, id: true } },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				staff: { select: { fullname: true, phone: true, id: true } },
				payment: { select: { id: true, total: true, card: true, cash: true, other: true, transfer: true, description: true } },
				products: {
					orderBy: [{ createdAt: 'desc' }],
					select: { id: true, price: true, count: true, cost: true, product: { select: { name: true, cost: true, count: true, price: true, id: true } } },
				},
			},
			orderBy: [{ createdAt: 'desc' }],
			...paginationOptions,
		})

		return arrivals
	}

	async findOne(query: ArrivalFindOneRequest) {
		const arrival = await this.prisma.arrivalModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				date: true,
				supplier: { select: { fullname: true, phone: true, id: true } },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				staff: { select: { fullname: true, phone: true, id: true } },
				payment: { select: { total: true, id: true, card: true, cash: true, other: true, transfer: true, description: true } },
				products: { orderBy: [{ createdAt: 'desc' }], select: { id: true, price: true, count: true, cost: true, product: { select: { name: true } } } },
			},
		})

		return arrival
	}

	async countFindMany(query: ArrivalFindManyRequest) {
		const arrivalsCount = await this.prisma.arrivalModel.count({
			where: {
				supplierId: query.supplierId,
				OR: [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
		})

		return arrivalsCount
	}

	async getMany(query: ArrivalGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const arrivals = await this.prisma.arrivalModel.findMany({
			where: {
				id: { in: query.ids },
				supplierId: query.supplierId,
			},
			select: {
				id: true,
				date: true,
				totalCost: true,
				totalPrice: true,
				supplier: {
					select: {
						id: true,
						fullname: true,
						balance: true,
						phone: true,
						payments: {
							where: { type: ServiceTypeEnum.client },
							select: { card: true, cash: true, other: true, transfer: true, total: true },
						},
					},
				},
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				staff: true,
				payment: true,
				products: { select: { price: true, count: true, cost: true, product: { select: { name: true } } } },
			},
			...paginationOptions,
		})

		return arrivals
	}

	async getOne(query: ArrivalGetOneRequest) {
		const arrival = await this.prisma.arrivalModel.findFirst({
			where: { id: query.id, supplierId: query.supplierId, staffId: query.staffId },
			select: { id: true, payment: true, staffId: true },
		})

		return arrival
	}

	async countGetMany(query: ArrivalGetManyRequest) {
		const arrivalsCount = await this.prisma.arrivalModel.count({
			where: {
				id: { in: query.ids },
				supplierId: query.supplierId,
			},
		})

		return arrivalsCount
	}

	async createOne(body: ArrivalCreateOneRequest) {
		const today = new Date()
		const dayClose = await this.prisma.dayCloseLog.findFirst({ where: { closedDate: today } })

		if (dayClose) {
			const tomorrow = new Date(today)
			tomorrow.setDate(today.getDate() + 1)
			tomorrow.setHours(0, 0, 0, 0)

			body.date = tomorrow
		}
		const arrival = await this.prisma.arrivalModel.create({
			data: {
				supplierId: body.supplierId,
				date: new Date(body.date),
				createdAt: dayClose ? body.date : undefined,
				totalCost: body.totalCost,
				totalPrice: body.totalPrice,
				staffId: body.staffId,
				payment: {
					create: {
						total: body.payment.total,
						card: body.payment?.card,
						cash: body.payment?.cash,
						other: body.payment?.other,
						transfer: body.payment?.transfer,
						description: body.payment?.description,
						userId: body.supplierId,
						staffId: body.staffId,
						type: ServiceTypeEnum.arrival,
						createdAt: dayClose ? body.date : undefined,
					},
				},
				products: {
					createMany: {
						skipDuplicates: false,
						data: body.products.map((p) => ({
							productId: p.productId,
							type: ServiceTypeEnum.arrival,
							cost: p.cost,
							count: p.count,
							price: p.price,
							totalCost: p.totalCost,
							totalPrice: p.totalPrice,
							staffId: body.staffId,
							createdAt: dayClose ? body.date : undefined,
						})),
					},
				},
			},
			select: {
				id: true,
				date: true,
				supplier: { select: { fullname: true, phone: true, id: true } },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				staff: { select: { fullname: true, phone: true, id: true } },
				payment: { select: { id: true, card: true, cash: true, other: true, transfer: true, description: true, total: true } },
				products: { select: { id: true, price: true, count: true, cost: true, product: { select: { name: true } } } },
			},
		})

		if (body.products) {
			const existingProducts = await this.prisma.productModel.findMany({
				where: { id: { in: body.products.map((p) => p.productId) } },
				select: { id: true },
			})

			const existingProductSet = new Set(existingProducts.map((p) => p.id))

			for (const product of body.products) {
				if (existingProductSet.has(product.productId)) {
					await this.prisma.productModel.update({
						where: { id: product.productId },
						data: { cost: product.cost, price: product.price, count: { increment: product.count } },
					})
				}
			}
		}

		return arrival
	}

	async updateOne(query: ArrivalGetOneRequest, body: ArrivalUpdateOneRequest) {
		const existArrival = await this.findOne(query)

		const arrival = await this.prisma.arrivalModel.update({
			where: { id: query.id },
			data: {
				supplierId: body.supplierId,
				date: body.date ? new Date(body.date) : undefined,
				deletedAt: body.deletedAt,
				totalCost: body.totalCost,
				totalPrice: body.totalPrice,
				payment: {
					update: {
						total: body.payment.total,
						card: body.payment?.card,
						cash: body.payment?.cash,
						other: body.payment?.other,
						transfer: body.payment?.transfer,
						description: body.payment?.description,
						createdAt: existArrival.payment.total ? undefined : new Date(),
					},
				},
			},
			select: { id: true, payment: true },
		})

		return arrival
	}

	async deleteOne(query: ArrivalDeleteOneRequest) {
		const arrival = await this.prisma.arrivalModel.delete({
			where: { id: query.id },
			select: { products: { select: { product: true, count: true } } },
		})

		await Promise.all(
			arrival.products.map((product) =>
				this.prisma.productModel.update({
					where: { id: product.product.id },
					data: { count: { decrement: product.count } },
				}),
			),
		)

		return arrival
	}

	async findManyArrivalProductMv(ids: string[]) {
		const productmvs = await this.prisma.productMVModel.findMany({
			where: { id: { in: ids }, type: ServiceTypeEnum.arrival },
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
		await this.prisma.createActionMethods(ArrivalController)
	}
}
