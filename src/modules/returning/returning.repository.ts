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

const RETURNING_PRODUCT_MV_PRICE_SELECT = {
	type: true,
	price: true,
	totalPrice: true,
	currencyId: true,
	currency: { select: { id: true, name: true, exchangeRate: true, symbol: true } },
}
const RETURNING_PRODUCT_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { select: RETURNING_PRODUCT_MV_PRICE_SELECT },
	product: { select: { id: true, name: true, count: true } },
}
const RETURNING_PAYMENT_LINE_SELECT = { type: true, currencyId: true, amount: true, currency: { select: { id: true, name: true, exchangeRate: true, symbol: true } } }
const RETURNING_PAYMENT_SELECT = {
	id: true,
	description: true,
	createdAt: true,
	paymentMethods: { select: RETURNING_PAYMENT_LINE_SELECT },
	changeMethods: { select: RETURNING_PAYMENT_LINE_SELECT },
}
const RETURNING_SELECT = {
	id: true as const,
	clientId: true as const,
	staffId: true as const,
	publicId: true as const,
	date: true as const,
	status: true as const,
	createdAt: true as const,
	updatedAt: true as const,
	deletedAt: true as const,
	client: { select: { id: true, fullname: true, phone: true } },
	staff: { select: { id: true, fullname: true, phone: true } },
	payment: { select: RETURNING_PAYMENT_SELECT },
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
			select: RETURNING_SELECT,
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
				...(body.payment &&
					((body.payment.paymentMethods?.length ?? 0) > 0 || (body.payment.changeMethods?.length ?? 0) > 0) && {
						payment: {
							create: {
								clientId: body.clientId,
								staffId: body.staffId,
								description: body.payment.description,
								...(body.payment.paymentMethods?.length && {
									paymentMethods: {
										createMany: {
											data: body.payment.paymentMethods.map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })),
										},
									},
								}),
								...(body.payment.changeMethods?.length && {
									changeMethods: {
										createMany: {
											data: body.payment.changeMethods.map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })),
										},
									},
								}),
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

		if (body.payment?.paymentMethods !== undefined || body.payment?.changeMethods !== undefined) {
			const existingPayment = existing.payment
			const pm = body.payment?.paymentMethods
			const cm = body.payment?.changeMethods
			if (existingPayment) {
				if (pm !== undefined) {
					await this.prisma.clientReturningPaymentMethodModel.deleteMany({ where: { paymentId: existingPayment.id } })
					if (pm.length) {
						await this.prisma.clientReturningPaymentMethodModel.createMany({
							data: pm.map((m) => ({
								type: m.type,
								currencyId: m.currencyId,
								amount: m.amount,
								paymentId: existingPayment.id,
							})),
						})
					}
				}
				if (cm !== undefined) {
					await this.prisma.clientReturningPaymentChangeMethodModel.deleteMany({ where: { paymentId: existingPayment.id } })
					if (cm.length) {
						await this.prisma.clientReturningPaymentChangeMethodModel.createMany({
							data: cm.map((m) => ({
								type: m.type,
								currencyId: m.currencyId,
								amount: m.amount,
								paymentId: existingPayment.id,
							})),
						})
					}
				}
				if (body.payment?.description !== undefined) {
					await this.prisma.clientReturningPaymentModel.update({ where: { id: existingPayment.id }, data: { description: body.payment.description } })
				}
			} else if ((pm?.length ?? 0) > 0 || (cm?.length ?? 0) > 0) {
				await this.prisma.clientReturningPaymentModel.create({
					data: {
						returningId: query.id,
						clientId: existing.clientId,
						staffId: existing.staffId,
						description: body.payment?.description,
						...((pm?.length ?? 0) > 0 && {
							paymentMethods: { createMany: { data: (pm ?? []).map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })) } },
						}),
						...((cm?.length ?? 0) > 0 && {
							changeMethods: { createMany: { data: (cm ?? []).map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })) } },
						}),
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
