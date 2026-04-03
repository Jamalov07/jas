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
import { PriceTypeEnum, ServiceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const TOTALS_SELECT = {
	id: true,
	currencyId: true,
	totalCost: true,
	totalPrice: true,
	currency: { select: { id: true, symbol: true, name: true } },
}

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
				totals: { select: TOTALS_SELECT },
				supplier: { select: { fullname: true, phone: true, id: true } },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				staff: { select: { fullname: true, phone: true, id: true } },
				payment: { select: { id: true, total: true, card: true, cash: true, other: true, transfer: true, description: true } },
				products: {
					orderBy: [{ createdAt: 'desc' }],
					select: {
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, type: true, currencyId: true, currency: { select: { symbol: true } } } },
						product: { select: { name: true, count: true, id: true } },
					},
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
				totals: { select: TOTALS_SELECT },
				supplier: { select: { fullname: true, phone: true, id: true } },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				staff: { select: { fullname: true, phone: true, id: true } },
				payment: { select: { total: true, id: true, card: true, cash: true, other: true, transfer: true, description: true } },
				products: {
					orderBy: [{ createdAt: 'desc' }],
					select: {
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, type: true, currencyId: true, currency: { select: { symbol: true } } } },
						product: { select: { name: true } },
					},
				},
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
				totals: { select: TOTALS_SELECT },
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
				products: {
					select: {
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, type: true, currencyId: true, currency: { select: { symbol: true } } } },
						product: { select: { name: true } },
					},
				},
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

		// Pre-fetch exchange rates for all currencies used
		const currencyIds = [...new Set((body.products ?? []).flatMap((p) => [p.costCurrencyId, p.priceCurrencyId]))]
		const currencies = await this.prisma.currencyModel.findMany({
			where: { id: { in: currencyIds } },
			select: { id: true, exchangeRate: true },
		})
		const currencyExchangeMap = Object.fromEntries(currencies.map((c) => [c.id, c.exchangeRate]))

		const arrival = await this.prisma.arrivalModel.create({
			data: {
				supplierId: body.supplierId,
				date: new Date(body.date),
				createdAt: dayClose ? body.date : undefined,
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
					create: (body.products ?? []).map((p) => ({
						productId: p.productId,
						type: ServiceTypeEnum.arrival,
						count: p.count,
						staffId: body.staffId,
						createdAt: dayClose ? body.date : undefined,
						productMVPrices: {
							createMany: {
								data: [
									{
										type: PriceTypeEnum.cost,
										price: p.cost,
										totalPrice: new Decimal(p.cost).mul(p.count),
										currencyId: p.costCurrencyId,
										exchangeRate: currencyExchangeMap[p.costCurrencyId] ?? 0,
									},
									{
										type: PriceTypeEnum.selling,
										price: p.price,
										totalPrice: new Decimal(p.price).mul(p.count),
										currencyId: p.priceCurrencyId,
										exchangeRate: currencyExchangeMap[p.priceCurrencyId] ?? 0,
									},
								],
							},
						},
					})),
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
				products: {
					select: {
						id: true,
						count: true,
						productMVPrices: { select: { type: true, price: true, totalPrice: true, currencyId: true } },
						product: { select: { id: true, name: true } },
					},
				},
			},
		})

		// Update product counts and selling prices
		for (const product of arrival.products) {
			await this.prisma.productModel.update({
				where: { id: product.product.id },
				data: { count: { increment: product.count } },
			})
		}

		// Upsert ArrivalTotalModel per currency
		for (const product of arrival.products) {
			for (const mvPrice of product.productMVPrices) {
				if (mvPrice.type === PriceTypeEnum.cost) {
					await this.prisma.arrivalTotalModel.upsert({
						where: { arrivalId_currencyId: { arrivalId: arrival.id, currencyId: mvPrice.currencyId } },
						update: { totalCost: { increment: mvPrice.totalPrice } },
						create: { arrivalId: arrival.id, currencyId: mvPrice.currencyId, totalCost: mvPrice.totalPrice, totalPrice: 0 },
					})
				} else if (mvPrice.type === PriceTypeEnum.selling) {
					await this.prisma.arrivalTotalModel.upsert({
						where: { arrivalId_currencyId: { arrivalId: arrival.id, currencyId: mvPrice.currencyId } },
						update: { totalPrice: { increment: mvPrice.totalPrice } },
						create: { arrivalId: arrival.id, currencyId: mvPrice.currencyId, totalCost: 0, totalPrice: mvPrice.totalPrice },
					})
				}
			}
		}

		// Update ProductPriceModel (selling/cost prices) from arrival
		for (const product of arrival.products) {
			const countResult = await this.prisma.productModel.findFirst({ where: { id: product.product.id }, select: { count: true } })
			const newCount = countResult?.count ?? product.count

			for (const mvPrice of product.productMVPrices) {
				if (mvPrice.type === PriceTypeEnum.selling || mvPrice.type === PriceTypeEnum.cost) {
					const existingProductPrice = await this.prisma.productPriceModel.findFirst({
						where: { productId: product.product.id, type: mvPrice.type },
					})
					if (existingProductPrice) {
						await this.prisma.productPriceModel.update({
							where: { id: existingProductPrice.id },
							data: { price: mvPrice.price, totalPrice: new Decimal(mvPrice.price).mul(newCount) },
						})
					}
				}
			}
		}

		return this.prisma.arrivalModel.findFirst({
			where: { id: arrival.id },
			select: {
				id: true,
				date: true,
				totals: { select: TOTALS_SELECT },
				supplier: { select: { fullname: true, phone: true, id: true } },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				staff: { select: { fullname: true, phone: true, id: true } },
				payment: { select: { id: true, card: true, cash: true, other: true, transfer: true, description: true, total: true } },
				products: {
					select: {
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, type: true, currencyId: true, currency: { select: { symbol: true } } } },
						product: { select: { name: true } },
					},
				},
			},
		})
	}

	async updateOne(query: ArrivalGetOneRequest, body: ArrivalUpdateOneRequest) {
		const existArrival = await this.findOne(query)

		const arrival = await this.prisma.arrivalModel.update({
			where: { id: query.id },
			data: {
				supplierId: body.supplierId,
				date: body.date ? new Date(body.date) : undefined,
				deletedAt: body.deletedAt,
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
				count: true,
				productMVPrices: { select: { price: true, type: true, currencyId: true } },
				product: true,
			},
		})

		return productmvs
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(ArrivalController)
	}
}
