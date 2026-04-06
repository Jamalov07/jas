import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	SellingCreateOneRequest,
	SellingDeleteOneRequest,
	SellingFindManyRequest,
	SellingFindOneRequest,
	SellingGetManyRequest,
	SellingGetOneRequest,
	SellingUpdateOneRequest,
} from './interfaces'
import { PriceTypeEnum, SellingStatusEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const PRODUCT_MV_PRICE_SELECT = { type: true, price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } } }
const PRODUCT_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { select: PRODUCT_MV_PRICE_SELECT },
	product: { select: { id: true, name: true, createdAt: true } },
}
const SELLING_PAYMENT_SELECT = {
	id: true,
	description: true,
	createdAt: true,
	clientSellingPaymentMethods: { select: { type: true, currencyId: true, amount: true } },
}
const SELLING_SELECT = {
	id: true as const,
	status: true as const,
	publicId: true as const,
	date: true as const,
	createdAt: true as const,
	updatedAt: true as const,
	deletedAt: true as const,
	client: { select: { id: true, fullname: true, phone: true, createdAt: true } },
	staff: { select: { id: true, fullname: true, phone: true, createdAt: true } },
	clientSellingPayment: { select: SELLING_PAYMENT_SELECT },
	products: {
		orderBy: [{ createdAt: 'desc' as const }, { id: 'asc' as const }],
		select: PRODUCT_MV_SELECT,
	},
}

@Injectable()
export class SellingRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

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

	async findMany(query: SellingFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const sellings = await this.prisma.sellingModel.findMany({
			where: {
				status: query.status,
				staffId: query.staffId,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
			orderBy: [{ date: 'desc' }],
			select: SELLING_SELECT,
			...paginationOptions,
		})

		return sellings
	}

	async findOne(query: SellingFindOneRequest) {
		const selling = await this.prisma.sellingModel.findFirst({
			where: { id: query.id },
			select: {
				...SELLING_SELECT,
				products: {
					orderBy: [{ createdAt: 'desc' as const }],
					select: {
						id: true,
						count: true,
						createdAt: true,
						prices: { select: { type: true, price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } } } },
						product: { select: { id: true, name: true, createdAt: true, prices: { select: { type: true, price: true, totalPrice: true, currencyId: true } } } },
					},
				},
			},
		})

		return selling
	}

	async countFindMany(query: SellingFindManyRequest) {
		return this.prisma.sellingModel.count({
			where: {
				status: query.status,
				staffId: query.staffId,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
		})
	}

	async getOne(query: SellingGetOneRequest) {
		return this.prisma.sellingModel.findFirst({
			where: { id: query.id, status: query.status, staffId: query.staffId },
			select: {
				id: true,
				status: true,
				date: true,
				clientId: true,
				staffId: true,
				createdAt: true,
				products: {
					select: {
						id: true,
						count: true,
						product: { select: { id: true, name: true, count: true } },
					},
				},
				clientSellingPayment: { select: { id: true, clientSellingPaymentMethods: { select: { type: true, currencyId: true, amount: true } } } },
			},
		})
	}

	async getMany(query: SellingGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}
		return this.prisma.sellingModel.findMany({
			where: { id: { in: query.ids }, status: query.status, date: { gte: query.startDate, lte: query.endDate } },
			select: SELLING_SELECT,
			...paginationOptions,
		})
	}

	async countGetMany(query: SellingGetManyRequest) {
		return this.prisma.sellingModel.count({ where: { id: { in: query.ids }, status: query.status } })
	}

	async createOne(body: SellingCreateOneRequest) {
		const selling = await this.prisma.sellingModel.create({
			data: {
				status: body.status,
				clientId: body.clientId,
				date: body.date ? new Date(body.date) : undefined,
				staffId: body.staffId,
				...(body.payment?.paymentMethods?.length && {
					clientSellingPayment: {
						create: {
							clientId: body.clientId,
							staffId: body.staffId,
							description: body.payment.description,
							clientSellingPaymentMethods: {
								createMany: {
									data: body.payment.paymentMethods.map((m) => ({
										type: m.type,
										currencyId: m.currencyId,
										amount: m.amount,
									})),
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
			select: { id: true, status: true, products: { select: { count: true, product: { select: { id: true, count: true } } } } },
		})

		if (selling.status === SellingStatusEnum.accepted) {
			for (const product of selling.products) {
				const newCount = product.product.count - product.count
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
				await this.syncProductPrices(product.product.id, newCount)
			}
		}

		return this.prisma.sellingModel.findFirst({ where: { id: selling.id }, select: SELLING_SELECT })
	}

	async updateOne(query: SellingGetOneRequest, body: SellingUpdateOneRequest) {
		const existing = await this.getOne(query)

		await this.prisma.sellingModel.update({
			where: { id: query.id },
			data: {
				date: existing.status !== SellingStatusEnum.accepted ? (body.date ? new Date(body.date) : undefined) : undefined,
				status: body.status,
				clientId: body.clientId,
				deletedAt: body.deletedAt,
			},
		})

		if (body.payment?.paymentMethods) {
			const existingPayment = await this.prisma.clientSellingPaymentModel.findFirst({ where: { sellingId: query.id } })
			if (existingPayment) {
				await this.prisma.clientSellingPaymentMethodModel.deleteMany({ where: { clientSellingPaymentId: existingPayment.id } })
				if (body.payment.paymentMethods.length) {
					await this.prisma.clientSellingPaymentMethodModel.createMany({
						data: body.payment.paymentMethods.map((m) => ({
							type: m.type,
							currencyId: m.currencyId,
							amount: m.amount,
							clientSellingPaymentId: existingPayment.id,
						})),
					})
				}
				if (body.payment.description !== undefined) {
					await this.prisma.clientSellingPaymentModel.update({ where: { id: existingPayment.id }, data: { description: body.payment.description } })
				}
			} else if (body.payment.paymentMethods.length) {
				await this.prisma.clientSellingPaymentModel.create({
					data: {
						sellingId: query.id,
						clientId: existing.clientId,
						staffId: existing.staffId,
						description: body.payment.description,
						clientSellingPaymentMethods: {
							createMany: { data: body.payment.paymentMethods.map((m) => ({ type: m.type, currencyId: m.currencyId, amount: m.amount })) },
						},
					},
				})
			}
		}

		if (body.status === SellingStatusEnum.accepted && existing.status !== SellingStatusEnum.accepted) {
			const sellingDate = body.date ? new Date(body.date) : new Date()
			const sortedProducts = [...existing.products].sort((a, b) => a.product.id.localeCompare(b.product.id))
			for (let i = 0; i < sortedProducts.length; i++) {
				const product = sortedProducts[sortedProducts.length - 1 - i]
				const newDate = new Date(sellingDate.getTime() - i * 1000)
				await this.prisma.sellingProductMVModel.update({ where: { id: product.id }, data: { createdAt: newDate } })
			}
			for (const product of existing.products) {
				const newCount = product.product.count - product.count
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
				await this.syncProductPrices(product.product.id, newCount)
			}
		}
	}

	async deleteOne(query: SellingDeleteOneRequest) {
		const selling = await this.prisma.sellingModel.delete({
			where: { id: query.id },
			select: { products: { select: { count: true, product: { select: { id: true, count: true } } } }, status: true },
		})

		if (selling.status === SellingStatusEnum.accepted) {
			for (const product of selling.products) {
				const newCount = product.product.count + product.count
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
				await this.syncProductPrices(product.product.id, newCount)
			}
		}

		return selling
	}

}
