import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ArrivalProductMVCreateOneRequest,
	ArrivalProductMVDeleteOneRequest,
	ArrivalProductMVFindManyRequest,
	ArrivalProductMVFindOneRequest,
	ArrivalProductMVUpdateOneRequest,
} from './interfaces'
import { PriceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const PRICES_SELECT = { id: true, type: true, price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true, id: true } } }

const ARRIVAL_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { select: PRICES_SELECT },
	product: { select: { id: true, name: true, createdAt: true } },
	staff: { select: { id: true, fullname: true } },
	arrival: { select: { id: true, date: true, supplier: { select: { id: true, fullname: true, phone: true } } } },
}

@Injectable()
export class ArrivalProductMVRepository {
	constructor(private readonly prisma: PrismaService) {}

	private async syncProductPrices(productId: string, newCount: number, priceUpdates?: { selling?: Decimal; cost?: Decimal }) {
		const prices = await this.prisma.productPriceModel.findMany({ where: { productId }, select: { id: true, type: true, price: true } })
		for (const p of prices) {
			const newPrice =
				p.type === 'selling' && priceUpdates?.selling !== undefined
					? new Decimal(priceUpdates.selling)
					: p.type === 'cost' && priceUpdates?.cost !== undefined
						? new Decimal(priceUpdates.cost)
						: p.price
			await this.prisma.productPriceModel.update({ where: { id: p.id }, data: { price: newPrice, totalPrice: new Decimal(newCount).mul(newPrice) } })
		}
	}

	async findMany(query: ArrivalProductMVFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}
		return this.prisma.arrivalProductMVModel.findMany({
			where: { arrivalId: query.arrivalId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
			select: ARRIVAL_MV_SELECT,
			orderBy: { createdAt: 'asc' },
			...paginationOptions,
		})
	}

	async countFindMany(query: ArrivalProductMVFindManyRequest) {
		return this.prisma.arrivalProductMVModel.count({
			where: { arrivalId: query.arrivalId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
		})
	}

	async findOne(query: ArrivalProductMVFindOneRequest) {
		return this.prisma.arrivalProductMVModel.findFirst({
			where: { id: query.id },
			select: {
				...ARRIVAL_MV_SELECT,
				productId: true,
				arrivalId: true,
				staffId: true,
				product: { select: { id: true, name: true, count: true } },
				arrival: { select: { id: true, date: true, staffId: true, supplier: { select: { id: true, fullname: true } } } },
			},
		})
	}

	async createOne(body: ArrivalProductMVCreateOneRequest) {
		const costTotal = new Decimal(body.cost).mul(body.count)
		const priceTotal = new Decimal(body.price).mul(body.count)

		const productMV = await this.prisma.arrivalProductMVModel.create({
			data: {
				count: body.count,
				arrivalId: body.arrivalId,
				productId: body.productId,
				staffId: body.staffId,
				prices: {
					createMany: {
						data: [
							{ type: PriceTypeEnum.cost, price: body.cost, totalPrice: costTotal, currencyId: body.costCurrencyId },
							{ type: PriceTypeEnum.selling, price: body.price, totalPrice: priceTotal, currencyId: body.priceCurrencyId },
						],
					},
				},
			},
			select: { id: true, count: true, productId: true },
		})

		const productInfo = await this.prisma.productModel.findFirst({ where: { id: productMV.productId }, select: { id: true, count: true } })
		const newCount = (productInfo?.count ?? 0) + productMV.count
		await this.prisma.productModel.update({ where: { id: productMV.productId }, data: { count: { increment: productMV.count } } })
		await this.syncProductPrices(productMV.productId, newCount, { cost: body.cost, selling: body.price })
	}

	async updateOne(query: ArrivalProductMVFindOneRequest, body: ArrivalProductMVUpdateOneRequest) {
		const existing = await this.findOne(query)
		const oldCostPrice = existing?.prices?.find((p) => p.type === PriceTypeEnum.cost)
		const oldSellingPrice = existing?.prices?.find((p) => p.type === PriceTypeEnum.selling)
		const newCount = body.count ?? existing?.count ?? 0
		const newCost = body.cost ?? oldCostPrice?.price ?? new Decimal(0)
		const newPrice = body.price ?? oldSellingPrice?.price ?? new Decimal(0)

		await this.prisma.arrivalProductMVModel.update({
			where: { id: query.id },
			data: { count: body.count, productId: body.productId, arrivalId: body.arrivalId },
		})

		if (oldCostPrice) {
			await this.prisma.arrivalProductMVPriceModel.update({
				where: { id: oldCostPrice.id },
				data: { price: newCost, totalPrice: new Decimal(newCost).mul(newCount), currencyId: body.costCurrencyId ?? oldCostPrice.currency?.id },
			})
		}
		if (oldSellingPrice) {
			await this.prisma.arrivalProductMVPriceModel.update({
				where: { id: oldSellingPrice.id },
				data: { price: newPrice, totalPrice: new Decimal(newPrice).mul(newCount), currencyId: body.priceCurrencyId ?? oldSellingPrice.currency?.id },
			})
		}

		const countDiff = newCount - (existing?.count ?? 0)
		const newProductCount = (existing?.product?.count ?? 0) + countDiff
		await this.prisma.productModel.update({ where: { id: existing?.product?.id }, data: { count: { increment: countDiff } } })
		await this.syncProductPrices(existing?.product?.id, newProductCount, { cost: newCost, selling: newPrice })
	}

	async deleteOne(query: ArrivalProductMVDeleteOneRequest) {
		const existing = await this.findOne(query)

		await this.prisma.arrivalProductMVModel.delete({ where: { id: query.id } })

		const newCount = (existing?.product?.count ?? 0) - (existing?.count ?? 0)
		await this.prisma.productModel.update({ where: { id: existing?.product?.id }, data: { count: { decrement: existing?.count } } })
		await this.syncProductPrices(existing?.product?.id, newCount)
	}
}
