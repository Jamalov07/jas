import { Injectable } from '@nestjs/common'
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
import { PriceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const ARRIVAL_PRODUCT_MV_PRICE_SELECT = {
	type: true,
	price: true,
	totalPrice: true,
	currencyId: true,
	currency: { select: { id: true, name: true, exchangeRate: true, symbol: true } },
}
const ARRIVAL_PRODUCT_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { orderBy: [{ createdAt: 'desc' as const }], select: ARRIVAL_PRODUCT_MV_PRICE_SELECT },
	product: { select: { id: true, name: true } },
}
const ARRIVAL_PAYMENT_LINE_SELECT = { type: true, currencyId: true, amount: true, currency: { select: { symbol: true } } }
const ARRIVAL_PAYMENT_SELECT = {
	id: true,
	description: true,
	createdAt: true,
	paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: ARRIVAL_PAYMENT_LINE_SELECT },
	changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: ARRIVAL_PAYMENT_LINE_SELECT },
}
const ARRIVAL_SELECT = {
	id: true as const,
	supplierId: true as const,
	staffId: true as const,
	publicId: true as const,
	date: true as const,
	createdAt: true as const,
	updatedAt: true as const,
	deletedAt: true as const,
	supplier: { select: { id: true, fullname: true, phone: true } },
	staff: { select: { id: true, fullname: true, phone: true } },
	payment: { select: ARRIVAL_PAYMENT_SELECT },
	products: {
		orderBy: [{ createdAt: 'desc' as const }],
		select: ARRIVAL_PRODUCT_MV_SELECT,
	},
}

@Injectable()
export class ArrivalRepository {
	constructor(private readonly prisma: PrismaService) {}

	private async syncProductPrices(productId: string, newCount: number, priceUpdates?: { selling?: Decimal; cost?: Decimal }) {
		const prices = await this.prisma.productPriceModel.findMany({
			where: { productId },
			select: { id: true, type: true, price: true },
		})
		for (const p of prices) {
			const newPrice =
				p.type === 'selling' && priceUpdates?.selling !== undefined
					? new Decimal(priceUpdates.selling)
					: p.type === 'cost' && priceUpdates?.cost !== undefined
						? new Decimal(priceUpdates.cost)
						: p.price
			await this.prisma.productPriceModel.update({
				where: { id: p.id },
				data: { price: newPrice, totalPrice: new Decimal(newCount).mul(newPrice) },
			})
		}
	}

	async findMany(query: ArrivalFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		return this.prisma.arrivalModel.findMany({
			where: {
				supplierId: query.supplierId,
				staffId: query.staffId,
				OR: [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
			orderBy: [{ date: 'desc' }],
			select: ARRIVAL_SELECT,
			...paginationOptions,
		})
	}

	async countFindMany(query: ArrivalFindManyRequest) {
		return this.prisma.arrivalModel.count({
			where: {
				supplierId: query.supplierId,
				staffId: query.staffId,
				OR: [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
		})
	}

	async findOne(query: ArrivalFindOneRequest) {
		return this.prisma.arrivalModel.findFirst({ where: { id: query.id }, select: ARRIVAL_SELECT })
	}

	async getOne(query: ArrivalGetOneRequest) {
		return this.prisma.arrivalModel.findFirst({
			where: { id: query.id, supplierId: query.supplierId, staffId: query.staffId },
			select: ARRIVAL_SELECT,
		})
	}

	async getMany(query: ArrivalGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}
		return this.prisma.arrivalModel.findMany({
			where: { id: { in: query.ids }, supplierId: query.supplierId },
			select: ARRIVAL_SELECT,
			...paginationOptions,
		})
	}

	async countGetMany(query: ArrivalGetManyRequest) {
		return this.prisma.arrivalModel.count({ where: { id: { in: query.ids }, supplierId: query.supplierId } })
	}

	async createOne(body: ArrivalCreateOneRequest) {
		const arrival = await this.prisma.arrivalModel.create({
			data: {
				supplierId: body.supplierId,
				date: new Date(body.date),
				staffId: body.staffId,
				...(body.payment &&
					((body.payment.paymentMethods?.length ?? 0) > 0 || (body.payment.changeMethods?.length ?? 0) > 0) && {
						payment: {
							create: {
								supplierId: body.supplierId,
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
							createMany: {
								data: [
									{
										type: PriceTypeEnum.cost,
										price: p.cost,
										totalPrice: new Decimal(p.cost).mul(p.count),
										currencyId: p.costCurrencyId,
									},
									{
										type: PriceTypeEnum.selling,
										price: p.price,
										totalPrice: new Decimal(p.price).mul(p.count),
										currencyId: p.priceCurrencyId,
									},
								],
							},
						},
					})),
				},
			},
			select: {
				id: true,
				products: {
					select: {
						count: true,
						prices: { select: { type: true, price: true, totalPrice: true, currencyId: true } },
						product: { select: { id: true, count: true } },
					},
				},
			},
		})

		for (const product of arrival.products) {
			const costPrice = product.prices.find((p) => p.type === PriceTypeEnum.cost)
			const sellingPrice = product.prices.find((p) => p.type === PriceTypeEnum.selling)
			const countAfter = product.product.count + product.count
			await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
			await this.syncProductPrices(product.product.id, countAfter, { cost: costPrice?.price, selling: sellingPrice?.price })
		}

		return this.prisma.arrivalModel.findFirst({ where: { id: arrival.id }, select: ARRIVAL_SELECT })
	}

	async updateOne(query: ArrivalGetOneRequest, body: ArrivalUpdateOneRequest) {
		const existing = await this.getOne(query)

		await this.prisma.arrivalModel.update({
			where: { id: query.id },
			data: {
				supplierId: body.supplierId,
				date: body.date ? new Date(body.date) : undefined,
				deletedAt: body.deletedAt,
			},
		})

		if (body.payment?.paymentMethods !== undefined || body.payment?.changeMethods !== undefined) {
			if (existing.payment) {
				const pm = body.payment?.paymentMethods
				const cm = body.payment?.changeMethods
				if (pm !== undefined) {
					await this.prisma.supplierArrivalPaymentMethodModel.deleteMany({ where: { paymentId: existing.payment.id } })
					if (pm.length) {
						await this.prisma.supplierArrivalPaymentMethodModel.createMany({
							data: pm.map((m) => ({
								type: m.type,
								currencyId: m.currencyId,
								amount: m.amount,
								paymentId: existing.payment.id,
							})),
						})
					}
				}
				if (cm !== undefined) {
					await this.prisma.supplierArrivalPaymentChangeMethodModel.deleteMany({ where: { paymentId: existing.payment.id } })
					if (cm.length) {
						await this.prisma.supplierArrivalPaymentChangeMethodModel.createMany({
							data: cm.map((m) => ({
								type: m.type,
								currencyId: m.currencyId,
								amount: m.amount,
								paymentId: existing.payment.id,
							})),
						})
					}
				}
				if (body.payment?.description !== undefined) {
					await this.prisma.supplierArrivalPaymentModel.update({ where: { id: existing.payment.id }, data: { description: body.payment.description } })
				}
			} else if ((body.payment?.paymentMethods?.length ?? 0) > 0 || (body.payment?.changeMethods?.length ?? 0) > 0) {
				const pm = body.payment?.paymentMethods ?? []
				const cm = body.payment?.changeMethods ?? []
				await this.prisma.supplierArrivalPaymentModel.create({
					data: {
						arrivalId: query.id,
						supplierId: existing.supplierId,
						staffId: existing.staffId,
						description: body.payment?.description,
						...(pm.length && { paymentMethods: { createMany: { data: pm.map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })) } } }),
						...(cm.length && { changeMethods: { createMany: { data: cm.map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })) } } }),
					},
				})
			}
		}
	}

	async deleteOne(query: ArrivalDeleteOneRequest) {
		const arrival = await this.prisma.arrivalModel.delete({
			where: { id: query.id },
			select: { products: { select: { count: true, product: { select: { id: true, count: true } } } } },
		})

		for (const product of arrival.products) {
			const countAfter = product.product.count - product.count
			await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
			await this.syncProductPrices(product.product.id, countAfter)
		}

		return arrival
	}
}
