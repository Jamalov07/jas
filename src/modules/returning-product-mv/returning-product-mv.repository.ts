import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ReturningProductMVCreateOneRequest,
	ReturningProductMVDeleteOneRequest,
	ReturningProductMVFindManyRequest,
	ReturningProductMVFindOneRequest,
	ReturningProductMVUpdateOneRequest,
} from './interfaces'
import { PriceTypeEnum, SellingStatusEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const PRICES_SELECT = { id: true, type: true, price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true, id: true } } }

const RETURNING_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { orderBy: [{ createdAt: 'desc' as const }], select: PRICES_SELECT },
	product: { select: { id: true, name: true, createdAt: true } },
	staff: { select: { id: true, fullname: true } },
	returning: { select: { id: true, date: true, status: true, client: { select: { id: true, fullname: true, phone: true } } } },
}

@Injectable()
export class ReturningProductMVRepository {
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

	async findMany(query: ReturningProductMVFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}
		return this.prisma.returningProductMVModel.findMany({
			where: { returningId: query.returningId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
			select: RETURNING_MV_SELECT,
			orderBy: { createdAt: 'asc' },
			...paginationOptions,
		})
	}

	async countFindMany(query: ReturningProductMVFindManyRequest) {
		return this.prisma.returningProductMVModel.count({
			where: { returningId: query.returningId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
		})
	}

	async findOne(query: ReturningProductMVFindOneRequest) {
		return this.prisma.returningProductMVModel.findFirst({
			where: { id: query.id },
			select: {
				...RETURNING_MV_SELECT,
				productId: true,
				returningId: true,
				staffId: true,
				product: { select: { id: true, name: true, count: true } },
				returning: { select: { id: true, date: true, status: true, client: { select: { id: true, fullname: true } } } },
			},
		})
	}

	async createOne(body: ReturningProductMVCreateOneRequest) {
		const totalPrice = new Decimal(body.price).mul(body.count)

		const productMV = await this.prisma.returningProductMVModel.create({
			data: {
				count: body.count,
				returningId: body.returningId,
				productId: body.productId,
				staffId: body.staffId,
				prices: { create: { type: PriceTypeEnum.selling, price: body.price, totalPrice, currencyId: body.currencyId } },
			},
			select: { id: true, count: true, productId: true, returningId: true },
		})

		const productInfo = await this.prisma.productModel.findFirst({ where: { id: productMV.productId }, select: { id: true, count: true } })
		const returningInfo = await this.prisma.returningModel.findFirst({ where: { id: productMV.returningId }, select: { status: true } })

		if (returningInfo?.status === SellingStatusEnum.accepted) {
			const newCount = (productInfo?.count ?? 0) + productMV.count
			await this.prisma.productModel.update({ where: { id: productMV.productId }, data: { count: { increment: productMV.count } } })
			await this.syncProductPrices(productMV.productId, newCount)
		}
	}

	async updateOne(query: ReturningProductMVFindOneRequest, body: ReturningProductMVUpdateOneRequest) {
		const existing = await this.findOne(query)
		const oldPrice = existing?.prices?.find((p) => p.type === PriceTypeEnum.selling)
		const newPrice = body.price ?? oldPrice?.price ?? new Decimal(0)
		const newCount = body.count ?? existing?.count ?? 0
		const newTotalPrice = new Decimal(newPrice).mul(newCount)

		await this.prisma.returningProductMVModel.update({
			where: { id: query.id },
			data: { count: body.count, productId: body.productId, returningId: body.returningId },
		})

		if (oldPrice) {
			await this.prisma.returningProductMVPriceModel.update({
				where: { id: oldPrice.id },
				data: { price: newPrice, totalPrice: newTotalPrice, currencyId: body.currencyId ?? oldPrice.currency?.id },
			})
		}

		if (existing?.returning?.status === SellingStatusEnum.accepted) {
			const countDiff = newCount - (existing?.count ?? 0)
			const newProductCount = (existing?.product?.count ?? 0) + countDiff
			await this.prisma.productModel.update({ where: { id: existing?.product?.id }, data: { count: { increment: countDiff } } })
			await this.syncProductPrices(existing?.product?.id, newProductCount)
		}
	}

	async deleteOne(query: ReturningProductMVDeleteOneRequest) {
		const existing = await this.findOne(query)

		await this.prisma.returningProductMVModel.delete({ where: { id: query.id } })

		if (existing?.returning?.status === SellingStatusEnum.accepted) {
			const newCount = (existing?.product?.count ?? 0) - (existing?.count ?? 0)
			await this.prisma.productModel.update({ where: { id: existing?.product?.id }, data: { count: { decrement: existing?.count } } })
			await this.syncProductPrices(existing?.product?.id, newCount)
		}
	}
}
