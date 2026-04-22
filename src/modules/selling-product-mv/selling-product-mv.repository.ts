import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	SellingProductMVCreateOneRequest,
	SellingProductMVDeleteOneRequest,
	SellingProductMVFindManyRequest,
	SellingProductMVFindOneRequest,
	SellingProductMVUpdateOneRequest,
} from './interfaces'
import { PriceTypeEnum, SellingStatusEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { calcSellingLineTotalPrice } from '@common'

const PRICES_SELECT = { id: true, type: true, price: true, discount: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true, id: true } } }

const SELLING_MV_SELECT = {
	id: true,
	count: true,
	createdAt: true,
	prices: { orderBy: [{ createdAt: 'desc' as const }], select: PRICES_SELECT },
	product: { select: { id: true, name: true, createdAt: true } },
	staff: { select: { id: true, fullname: true } },
	selling: { select: { publicId: true, id: true, date: true, status: true, client: { select: { id: true, fullname: true, phone: true } } } },
}

@Injectable()
export class SellingProductMVRepository {
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

	async findMany(query: SellingProductMVFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}
		return this.prisma.sellingProductMVModel.findMany({
			where: { sellingId: query.sellingId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
			select: SELLING_MV_SELECT,
			orderBy: { createdAt: 'asc' },
			...paginationOptions,
		})
	}

	async countFindMany(query: SellingProductMVFindManyRequest) {
		return this.prisma.sellingProductMVModel.count({
			where: { sellingId: query.sellingId, productId: query.productId, staffId: query.staffId, createdAt: { gte: query.startDate, lte: query.endDate } },
		})
	}

	async findOne(query: SellingProductMVFindOneRequest) {
		return this.prisma.sellingProductMVModel.findFirst({
			where: { id: query.id },
			select: {
				...SELLING_MV_SELECT,
				product: { select: { id: true, name: true, count: true, createdAt: true } },
				productId: true,
				sellingId: true,
				staffId: true,
				selling: {
					select: {
						id: true,
						status: true,
						publicId: true,
						date: true,
						createdAt: true,
						client: { select: { id: true, fullname: true, phone: true } },
						staff: { select: { id: true, fullname: true, phone: true } },
						payment: {
							select: {
								id: true,
								description: true,
								paymentMethods: { orderBy: [{ createdAt: 'desc' as const }], select: { type: true, currencyId: true, amount: true } },
								changeMethods: { orderBy: [{ createdAt: 'desc' as const }], select: { type: true, currencyId: true, amount: true } },
							},
						},
						products: {
							orderBy: [{ createdAt: 'desc' as const }],
							select: {
								id: true,
								count: true,
								createdAt: true,
								prices: {
									orderBy: [{ createdAt: 'desc' as const }],
									select: { type: true, price: true, discount: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } } },
								},
								product: { select: { id: true, name: true } },
							},
						},
					},
				},
			},
		})
	}

	async createOne(body: SellingProductMVCreateOneRequest) {
		const discount = new Decimal(body.discount ?? 0)
		const totalPrice = calcSellingLineTotalPrice(body.price, body.count, discount)

		const productMV = await this.prisma.sellingProductMVModel.create({
			data: {
				count: body.count,
				sellingId: body.sellingId,
				productId: body.productId,
				staffId: body.staffId,
				prices: {
					create: {
						type: PriceTypeEnum.selling,
						price: new Decimal(body.price),
						discount,
						totalPrice,
						currencyId: body.currencyId,
					},
				},
			},
			select: { id: true, count: true, productId: true, sellingId: true },
		})

		const productInfo = await this.prisma.productModel.findFirst({ where: { id: productMV.productId }, select: { id: true, count: true } })
		const sellingInfo = await this.prisma.sellingModel.findFirst({ where: { id: productMV.sellingId }, select: { status: true } })

		if (sellingInfo?.status === SellingStatusEnum.accepted) {
			const newCount = (productInfo?.count ?? 0) - productMV.count
			await this.prisma.productModel.update({ where: { id: productMV.productId }, data: { count: { decrement: productMV.count } } })
			await this.syncProductPrices(productMV.productId, newCount)
		}
	}

	async updateOne(query: SellingProductMVFindOneRequest, body: SellingProductMVUpdateOneRequest) {
		const existing = await this.findOne(query)
		const oldPrice = existing?.prices?.find((p) => p.type === PriceTypeEnum.selling)
		const newPrice = body.price ?? oldPrice?.price ?? new Decimal(0)
		const newCount = body.count ?? existing?.count ?? 0
		const newDiscount = body.discount !== undefined ? new Decimal(body.discount) : (oldPrice?.discount ?? new Decimal(0))
		const newTotalPrice = calcSellingLineTotalPrice(newPrice, newCount, newDiscount)

		await this.prisma.sellingProductMVModel.update({
			where: { id: query.id },
			data: { count: body.count, productId: body.productId, sellingId: body.sellingId },
		})

		if (oldPrice) {
			await this.prisma.sellingProductMVPriceModel.update({
				where: { id: oldPrice.id },
				data: {
					price: new Decimal(newPrice),
					discount: newDiscount,
					totalPrice: newTotalPrice,
					currencyId: body.currencyId ?? oldPrice.currency?.id,
				},
			})
		}

		if (existing?.selling?.status === SellingStatusEnum.accepted) {
			const countDiff = (existing.count ?? 0) - newCount
			const newProductCount = (existing?.product?.count ?? 0) + countDiff
			await this.prisma.productModel.update({ where: { id: existing?.product?.id }, data: { count: { increment: countDiff } } })
			await this.syncProductPrices(existing?.product?.id, newProductCount)
		}
	}

	async deleteOne(query: SellingProductMVDeleteOneRequest) {
		const existing = await this.findOne(query)

		await this.prisma.sellingProductMVModel.delete({ where: { id: query.id } })

		if (existing?.selling?.status === SellingStatusEnum.accepted) {
			const newCount = (existing?.product?.count ?? 0) + (existing?.count ?? 0)
			await this.prisma.productModel.update({ where: { id: existing?.product?.id }, data: { count: { increment: existing?.count } } })
			await this.syncProductPrices(existing?.product?.id, newCount)
		}
	}
}
