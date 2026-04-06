import { Injectable } from '@nestjs/common'
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
import { PriceTypeEnum, SellingStatusEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const RETURNING_PRODUCT_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { select: { type: true, price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } } } },
	product: { select: { id: true, name: true } },
}
const RETURNING_PAYMENT_SELECT = {
	id: true,
	description: true,
	createdAt: true,
	clientReturningPaymentMethods: { select: { type: true, currencyId: true, amount: true } },
}
const RETURNING_SELECT = {
	id: true as const,
	publicId: true as const,
	date: true as const,
	status: true as const,
	createdAt: true as const,
	updatedAt: true as const,
	deletedAt: true as const,
	client: { select: { id: true, fullname: true, phone: true } },
	staff: { select: { id: true, fullname: true, phone: true } },
	clientReturningPayments: { select: RETURNING_PAYMENT_SELECT },
	products: {
		orderBy: [{ createdAt: 'desc' as const }],
		select: RETURNING_PRODUCT_MV_SELECT,
	},
}

@Injectable()
export class ReturningRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	private async syncProductPrices(productId: string, newCount: number) {
		const prices = await this.prisma.productPriceModel.findMany({
			where: { productId },
			select: { id: true, price: true },
		})
		for (const p of prices) {
			await this.prisma.productPriceModel.update({
				where: { id: p.id },
				data: { totalPrice: new Decimal(newCount).mul(p.price) },
			})
		}
	}

	async findMany(query: ReturningFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		return this.prisma.returningModel.findMany({
			where: {
				status: query.status,
				staffId: query.staffId,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
			orderBy: [{ date: 'desc' }],
			select: RETURNING_SELECT,
			...paginationOptions,
		})
	}

	async countFindMany(query: ReturningFindManyRequest) {
		return this.prisma.returningModel.count({
			where: {
				status: query.status,
				staffId: query.staffId,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
		})
	}

	async findOne(query: ReturningFindOneRequest) {
		return this.prisma.returningModel.findFirst({ where: { id: query.id }, select: RETURNING_SELECT })
	}

	async getOne(query: ReturningGetOneRequest) {
		return this.prisma.returningModel.findFirst({
			where: { id: query.id, status: query.status, staffId: query.staffId, clientId: query.clientId },
			select: {
				id: true,
				status: true,
				staffId: true,
				clientId: true,
				clientReturningPayments: { select: { id: true } },
				products: {
					select: {
						id: true,
						count: true,
						product: { select: { id: true, count: true } },
					},
				},
			},
		})
	}

	async getMany(query: ReturningGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}
		return this.prisma.returningModel.findMany({
			where: { id: { in: query.ids }, status: query.status, clientId: query.clientId },
			select: RETURNING_SELECT,
			...paginationOptions,
		})
	}

	async countGetMany(query: ReturningGetManyRequest) {
		return this.prisma.returningModel.count({ where: { id: { in: query.ids }, status: query.status } })
	}

	async createOne(body: ReturningCreateOneRequest) {
		const returning = await this.prisma.returningModel.create({
			data: {
				clientId: body.clientId,
				staffId: body.staffId,
				status: body.status,
				date: body.date ? new Date(body.date) : undefined,
				...(body.payment?.paymentMethods?.length && {
					clientReturningPayments: {
						create: {
							clientId: body.clientId,
							staffId: body.staffId,
							description: body.payment.description,
							clientReturningPaymentMethods: {
								createMany: {
									data: body.payment.paymentMethods.map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })),
								},
							},
						},
					},
				}),
				products: {
					create: (body.products ?? []).map((p) => ({
						productId: p.productId,
						count: p.count,
						staffId: body.staffId,
						prices: {
							create: {
								type: PriceTypeEnum.selling,
								price: p.price,
								totalPrice: new Decimal(p.price).mul(p.count),
								currencyId: p.currencyId,
							},
						},
					})),
				},
			},
			select: {
				id: true,
				status: true,
				products: { select: { count: true, product: { select: { id: true, count: true } } } },
			},
		})

		if (returning.status === SellingStatusEnum.accepted) {
			for (const product of returning.products) {
				const newCount = product.product.count + product.count
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
				await this.syncProductPrices(product.product.id, newCount)
			}
		}

		return this.prisma.returningModel.findFirst({ where: { id: returning.id }, select: RETURNING_SELECT })
	}

	async updateOne(query: ReturningGetOneRequest, body: ReturningUpdateOneRequest) {
		const existing = await this.getOne(query)

		if (existing.status !== SellingStatusEnum.accepted && body.status === SellingStatusEnum.accepted) {
			body.date = new Date()
		}

		await this.prisma.returningModel.update({
			where: { id: query.id },
			data: {
				clientId: body.clientId,
				staffId: body.staffId,
				status: body.status,
				date: body.date ? new Date(body.date) : undefined,
				deletedAt: body.deletedAt,
			},
		})

		if (body.payment?.paymentMethods) {
			const existingPayment = existing.clientReturningPayments
			if (existingPayment) {
				await this.prisma.clientReturningPaymentMethodModel.deleteMany({ where: { clientReturningPaymentId: existingPayment.id } })
				if (body.payment.paymentMethods.length) {
					await this.prisma.clientReturningPaymentMethodModel.createMany({
						data: body.payment.paymentMethods.map((m) => ({
							type: m.type,
							currencyId: m.currencyId,
							amount: m.amount,
							clientReturningPaymentId: existingPayment.id,
						})),
					})
				}
				if (body.payment.description !== undefined) {
					await this.prisma.clientReturningPaymentModel.update({ where: { id: existingPayment.id }, data: { description: body.payment.description } })
				}
			} else if (body.payment.paymentMethods.length) {
				await this.prisma.clientReturningPaymentModel.create({
					data: {
						returningId: query.id,
						clientId: existing.clientId,
						staffId: existing.staffId,
						description: body.payment.description,
						clientReturningPaymentMethods: {
							createMany: { data: body.payment.paymentMethods.map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })) },
						},
					},
				})
			}
		}

		if (body.status === SellingStatusEnum.accepted && existing.status !== SellingStatusEnum.accepted) {
			for (const product of existing.products) {
				const newCount = product.product.count + product.count
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
				await this.syncProductPrices(product.product.id, newCount)
			}
		}
	}

	async deleteOne(query: ReturningDeleteOneRequest) {
		const returning = await this.prisma.returningModel.delete({
			where: { id: query.id },
			select: { products: { select: { count: true, product: { select: { id: true, count: true } } } }, status: true },
		})

		if (returning.status === SellingStatusEnum.accepted) {
			for (const product of returning.products) {
				const newCount = product.product.count - product.count
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
				await this.syncProductPrices(product.product.id, newCount)
			}
		}

		return returning
	}

}
