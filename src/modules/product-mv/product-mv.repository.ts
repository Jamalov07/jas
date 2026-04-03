import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	ArrivalProductMVCreateOneRequest,
	ArrivalProductMVUpdateOneRequest,
	ProductMVDeleteOneRequest,
	ProductMVFindManyRequest,
	ProductMVFindOneRequest,
	ProductMVGetManyRequest,
	ProductMVGetOneRequest,
	ReturningProductMVCreateOneRequest,
	ReturningProductMVUpdateOneRequest,
	SellingProductMVCreateOneRequest,
	SellingProductMVUpdateOneRequest,
} from './interfaces'
import { PriceTypeEnum, SellingStatusEnum, ServiceTypeEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const MV_PRICES_SELECT = {
	type: true,
	price: true,
	totalPrice: true,
	currencyId: true,
	currency: { select: { symbol: true, id: true } },
}

@Injectable()
export class ProductMVRepository {
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

	async findMany(query: ProductMVFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const productMVs = await this.prisma.productMVModel.findMany({
			select: {
				id: true,
				count: true,
				productMVPrices: { select: MV_PRICES_SELECT },
				product: { select: { id: true, name: true, createdAt: true } },
				type: true,
				selling: {
					select: { publicId: true, id: true, createdAt: true, date: true, status: true, client: { select: { id: true, fullname: true, phone: true, createdAt: true } } },
				},
				arrival: { select: { id: true, date: true, supplier: { select: { id: true, fullname: true, phone: true, createdAt: true } } } },
				returning: { select: { id: true, date: true, client: { select: { id: true, fullname: true, phone: true, createdAt: true } } } },
				createdAt: true,
				staff: { select: { id: true, fullname: true } },
			},
			where: {
				sellingId: query.sellingId,
				arrivalId: query.arrivalId,
				productId: query.productId,
				returningId: query.returningId,
				staffId: query.staffId,
				type: query.type,
			},
			orderBy: [{ createdAt: 'asc' }],
			...paginationOptions,
		})

		return productMVs
	}

	async findManyForStats(query: ProductMVFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const productMVs = await this.prisma.productMVModel.findMany({
			select: {
				id: true,
				count: true,
				productMVPrices: { select: MV_PRICES_SELECT },
				product: { select: { id: true, name: true, createdAt: true } },
				type: true,
				selling: {
					select: { publicId: true, id: true, createdAt: true, date: true, status: true, client: { select: { id: true, fullname: true, phone: true, createdAt: true } } },
				},
				arrival: { select: { id: true, date: true, supplier: { select: { id: true, fullname: true, phone: true, createdAt: true } } } },
				returning: { select: { id: true, date: true, client: { select: { id: true, fullname: true, phone: true, createdAt: true } } } },
				createdAt: true,
				staff: { select: { id: true, fullname: true } },
			},
			where: {
				createdAt: { gte: query.startDate, lte: query.endDate },
				OR: [
					{ type: ServiceTypeEnum.arrival },
					{ type: ServiceTypeEnum.selling, selling: { status: SellingStatusEnum.accepted } },
					{ type: ServiceTypeEnum.returning, returning: { status: SellingStatusEnum.accepted } },
				],
				productId: query.productId,
				staffId: query.staffId,
			},
			orderBy: [{ createdAt: 'asc' }],
			...paginationOptions,
		})

		return productMVs
	}

	async findOne(query: ProductMVFindOneRequest) {
		const product = await this.prisma.productMVModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				count: true,
				type: true,
				productId: true,
				sellingId: true,
				arrivalId: true,
				returningId: true,
				staffId: true,
				createdAt: true,
				productMVPrices: { select: { ...MV_PRICES_SELECT, exchangeRate: true } },
			},
		})

		return product
	}

	async countFindMany(query: ProductMVFindManyRequest) {
		const productMVsCount = await this.prisma.productMVModel.count({
			where: {
				sellingId: query.sellingId,
				arrivalId: query.arrivalId,
				productId: query.productId,
				returningId: query.returningId,
				staffId: query.staffId,
				type: query.type,
			},
		})

		return productMVsCount
	}

	async getMany(query: ProductMVGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const productMVs = await this.prisma.productMVModel.findMany({
			where: {
				sellingId: query.sellingId,
				arrivalId: query.arrivalId,
				productId: query.productId,
				returningId: query.returningId,
				staffId: query.staffId,
				type: query.type,
			},
			...paginationOptions,
		})

		return productMVs
	}

	async getOne(query: ProductMVGetOneRequest) {
		const product = await this.prisma.productMVModel.findFirst({
			where: {
				id: query.id,
				sellingId: query.sellingId,
				arrivalId: query.arrivalId,
				productId: query.productId,
				returningId: query.returningId,
				staffId: query.staffId,
				type: query.type,
			},
			select: {
				id: true,
				count: true,
				type: true,
				productId: true,
				sellingId: true,
				arrivalId: true,
				returningId: true,
				staffId: true,
				createdAt: true,
				productMVPrices: { select: { ...MV_PRICES_SELECT, id: true, exchangeRate: true } },
				selling: {
					select: {
						id: true,
						status: true,
						publicId: true,
						totals: { select: { id: true, currencyId: true, total: true, currency: { select: { symbol: true, id: true, name: true } } } },
						createdAt: true,
						date: true,
						client: { select: { fullname: true, phone: true, id: true, createdAt: true, telegram: true } },
						staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
						payment: { select: { id: true, card: true, cash: true, other: true, transfer: true, description: true, total: true } },
						products: {
							select: {
								createdAt: true,
								id: true,
								count: true,
								productMVPrices: { select: MV_PRICES_SELECT },
								product: { select: { name: true, id: true, createdAt: true } },
							},
						},
					},
				},
				arrival: {
					select: {
						date: true,
						createdAt: true,
						id: true,
						payment: true,
						products: true,
						staff: true,
						updatedAt: true,
						staffId: true,
						supplier: true,
						supplierId: true,
						totals: { select: { id: true, currencyId: true, totalCost: true, totalPrice: true, currency: { select: { symbol: true, id: true, name: true } } } },
					},
				},
				returning: {
					select: {
						id: true,
						status: true,
						totals: { select: { id: true, currencyId: true, total: true, currency: { select: { symbol: true, id: true, name: true } } } },
					},
				},
				product: true,
			},
		})

		return product
	}

	async countGetMany(query: ProductMVGetManyRequest) {
		const productMVsCount = await this.prisma.productMVModel.count({
			where: {
				sellingId: query.sellingId,
				arrivalId: query.arrivalId,
				productId: query.productId,
				returningId: query.returningId,
				staffId: query.staffId,
				type: query.type,
			},
		})

		return productMVsCount
	}

	async createOneSelling(body: SellingProductMVCreateOneRequest) {
		const currency = await this.prisma.currencyModel.findFirst({ where: { id: body.currencyId }, select: { exchangeRate: true } })
		const totalPrice = new Decimal(body.price).mul(body.count)

		const product = await this.prisma.productMVModel.create({
			data: {
				count: body.count,
				sellingId: body.sellingId,
				type: ServiceTypeEnum.selling,
				productId: body.productId,
				staffId: body.staffId,
				productMVPrices: {
					create: {
						type: PriceTypeEnum.selling,
						price: body.price,
						totalPrice: totalPrice,
						currencyId: body.currencyId,
						exchangeRate: currency?.exchangeRate ?? 0,
					},
				},
			},
			select: {
				id: true,
				count: true,
				productMVPrices: { select: { currencyId: true, totalPrice: true, type: true } },
				createdAt: true,
				selling: {
					select: {
						id: true,
						status: true,
						publicId: true,
						createdAt: true,
						date: true,
						totals: { select: { id: true, currencyId: true, total: true, currency: { select: { symbol: true, id: true, name: true } } } },
						client: { select: { fullname: true, phone: true, id: true, createdAt: true, telegram: true } },
						staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
						payment: { select: { id: true, card: true, cash: true, other: true, transfer: true, description: true, total: true } },
						products: {
							select: {
								createdAt: true,
								id: true,
								count: true,
								productMVPrices: { select: MV_PRICES_SELECT },
								product: { select: { name: true, id: true, createdAt: true } },
							},
						},
					},
				},
				product: true,
			},
		})

		// Upsert SellingTotalModel
		for (const mvPrice of product.productMVPrices) {
			await this.prisma.sellingTotalModel.upsert({
				where: { sellingId_currencyId: { sellingId: body.sellingId, currencyId: mvPrice.currencyId } },
				update: { total: { increment: mvPrice.totalPrice } },
				create: { sellingId: body.sellingId, currencyId: mvPrice.currencyId, total: mvPrice.totalPrice },
			})
		}

		if (product.selling.status === SellingStatusEnum.accepted) {
			await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
			await this.syncProductPrices(product.product.id, product.product.count - product.count)
		}

		return product
	}

	async createOneArrival(body: ArrivalProductMVCreateOneRequest) {
		const costCurrency = await this.prisma.currencyModel.findFirst({ where: { id: body.costCurrencyId }, select: { exchangeRate: true } })
		const priceCurrency = await this.prisma.currencyModel.findFirst({ where: { id: body.priceCurrencyId }, select: { exchangeRate: true } })

		const costTotal = new Decimal(body.cost).mul(body.count)
		const priceTotal = new Decimal(body.price).mul(body.count)

		const product = await this.prisma.productMVModel.create({
			data: {
				count: body.count,
				arrivalId: body.arrivalId,
				type: ServiceTypeEnum.arrival,
				productId: body.productId,
				staffId: body.staffId,
				productMVPrices: {
					createMany: {
						data: [
							{
								type: PriceTypeEnum.cost,
								price: body.cost,
								totalPrice: costTotal,
								currencyId: body.costCurrencyId,
								exchangeRate: costCurrency?.exchangeRate ?? 0,
							},
							{
								type: PriceTypeEnum.selling,
								price: body.price,
								totalPrice: priceTotal,
								currencyId: body.priceCurrencyId,
								exchangeRate: priceCurrency?.exchangeRate ?? 0,
							},
						],
					},
				},
			},
			select: {
				product: true,
				count: true,
				productMVPrices: { select: { currencyId: true, totalPrice: true, type: true, price: true } },
				arrival: {
					select: {
						date: true,
						createdAt: true,
						id: true,
						payment: true,
						staff: true,
						staffId: true,
						supplier: true,
						supplierId: true,
						totals: { select: { id: true, currencyId: true, totalCost: true, totalPrice: true, currency: { select: { symbol: true, id: true, name: true } } } },
					},
				},
			},
		})

		await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })

		// Upsert ArrivalTotalModel
		for (const mvPrice of product.productMVPrices) {
			if (mvPrice.type === PriceTypeEnum.cost) {
				await this.prisma.arrivalTotalModel.upsert({
					where: { arrivalId_currencyId: { arrivalId: body.arrivalId, currencyId: mvPrice.currencyId } },
					update: { totalCost: { increment: mvPrice.totalPrice } },
					create: { arrivalId: body.arrivalId, currencyId: mvPrice.currencyId, totalCost: mvPrice.totalPrice, totalPrice: 0 },
				})
			} else if (mvPrice.type === PriceTypeEnum.selling) {
				await this.prisma.arrivalTotalModel.upsert({
					where: { arrivalId_currencyId: { arrivalId: body.arrivalId, currencyId: mvPrice.currencyId } },
					update: { totalPrice: { increment: mvPrice.totalPrice } },
					create: { arrivalId: body.arrivalId, currencyId: mvPrice.currencyId, totalCost: 0, totalPrice: mvPrice.totalPrice },
				})
			}
		}

		// Sync product prices
		const costPrice = product.productMVPrices.find((p) => p.type === PriceTypeEnum.cost)
		const sellingPrice = product.productMVPrices.find((p) => p.type === PriceTypeEnum.selling)
		const newCount = product.product.count + product.count

		await this.syncProductPrices(product.product.id, newCount, {
			selling: sellingPrice?.price,
			cost: costPrice?.price,
		})

		return product
	}

	async createOneReturning(body: ReturningProductMVCreateOneRequest) {
		const currency = await this.prisma.currencyModel.findFirst({ where: { id: body.currencyId }, select: { exchangeRate: true } })
		const totalPrice = new Decimal(body.price).mul(body.count)

		const product = await this.prisma.productMVModel.create({
			data: {
				count: body.count,
				returningId: body.returningId,
				type: ServiceTypeEnum.returning,
				productId: body.productId,
				staffId: body.staffId,
				productMVPrices: {
					create: {
						type: PriceTypeEnum.selling,
						price: body.price,
						totalPrice: totalPrice,
						currencyId: body.currencyId,
						exchangeRate: currency?.exchangeRate ?? 0,
					},
				},
			},
			select: {
				returning: true,
				product: true,
				count: true,
				productMVPrices: { select: { currencyId: true, totalPrice: true, type: true } },
			},
		})

		// Upsert ReturningTotalModel
		for (const mvPrice of product.productMVPrices) {
			await this.prisma.returningTotalModel.upsert({
				where: { returningId_currencyId: { returningId: body.returningId, currencyId: mvPrice.currencyId } },
				update: { total: { increment: mvPrice.totalPrice } },
				create: { returningId: body.returningId, currencyId: mvPrice.currencyId, total: mvPrice.totalPrice },
			})
		}

		if (product.returning.status === SellingStatusEnum.accepted) {
			await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
			await this.syncProductPrices(product.product.id, product.product.count + product.count)
		}

		return product
	}

	async updateOneSelling(query: ProductMVGetOneRequest, body: SellingProductMVUpdateOneRequest) {
		const pr = await this.getOne({ id: query.id })

		const oldSellingPrice = pr.productMVPrices.find((p) => p.type === PriceTypeEnum.selling)
		const newPrice = body.price ?? oldSellingPrice?.price ?? new Decimal(0)
		const newCount = body.count ?? pr.count
		const newTotalPrice = new Decimal(newPrice).mul(newCount)
		const oldTotalPrice = oldSellingPrice?.totalPrice ?? new Decimal(0)

		const product = await this.prisma.productMVModel.update({
			where: { id: query.id },
			data: {
				count: body.count,
				productId: body.productId,
				sellingId: body.sellingId,
			},
			select: {
				id: true,
				count: true,
				productMVPrices: { select: { ...MV_PRICES_SELECT, id: true } },
				selling: {
					select: {
						id: true,
						status: true,
						publicId: true,
						updatedAt: true,
						createdAt: true,
						deletedAt: true,
						date: true,
						totals: { select: { id: true, currencyId: true, total: true, currency: { select: { symbol: true, id: true, name: true } } } },
						client: { select: { fullname: true, phone: true, id: true, createdAt: true, telegram: true } },
						staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
						payment: { select: { total: true, id: true, card: true, cash: true, other: true, transfer: true, description: true } },
						products: {
							select: {
								createdAt: true,
								id: true,
								count: true,
								productMVPrices: { select: MV_PRICES_SELECT },
								product: { select: { name: true, id: true, createdAt: true } },
							},
						},
					},
				},
				product: true,
			},
		})

		// Update ProductMVPriceModel for selling type
		if (oldSellingPrice) {
			const currencyId = body.currencyId ?? oldSellingPrice.currency.id
			await this.prisma.productMVPriceModel.update({
				where: { id: oldSellingPrice.id },
				data: { price: newPrice, totalPrice: newTotalPrice, currencyId: currencyId },
			})
		}

		// Update SellingTotalModel: subtract old, add new
		if (oldSellingPrice) {
			const oldCurrencyId = oldSellingPrice.currency.id
			const newCurrencyId = body.currencyId ?? oldCurrencyId

			if (oldCurrencyId === newCurrencyId) {
				await this.prisma.sellingTotalModel.update({
					where: { sellingId_currencyId: { sellingId: product.selling.id, currencyId: oldCurrencyId } },
					data: { total: { increment: newTotalPrice.minus(oldTotalPrice) } },
				})
			} else {
				await this.prisma.sellingTotalModel.update({
					where: { sellingId_currencyId: { sellingId: product.selling.id, currencyId: oldCurrencyId } },
					data: { total: { decrement: oldTotalPrice } },
				})
				await this.prisma.sellingTotalModel.upsert({
					where: { sellingId_currencyId: { sellingId: product.selling.id, currencyId: newCurrencyId } },
					update: { total: { increment: newTotalPrice } },
					create: { sellingId: product.selling.id, currencyId: newCurrencyId, total: newTotalPrice },
				})
			}
		}

		if (product.selling.status === SellingStatusEnum.accepted) {
			await this.prisma.productModel.update({
				where: { id: product.product.id },
				data: { count: { increment: pr.count - product.count } },
			})
			await this.syncProductPrices(product.product.id, product.product.count + (pr.count - product.count))
		}

		return product
	}

	async updateOneArrival(query: ProductMVGetOneRequest, body: ArrivalProductMVUpdateOneRequest) {
		const pr = await this.getOne({ id: query.id })

		const oldCostPrice = pr.productMVPrices.find((p) => p.type === PriceTypeEnum.cost)
		const oldSellingPrice = pr.productMVPrices.find((p) => p.type === PriceTypeEnum.selling)

		const newCount = body.count ?? pr.count
		const newCost = body.cost ?? oldCostPrice?.price ?? new Decimal(0)
		const newPrice = body.price ?? oldSellingPrice?.price ?? new Decimal(0)
		const newCostTotal = new Decimal(newCost).mul(newCount)
		const newPriceTotal = new Decimal(newPrice).mul(newCount)
		const oldCostTotal = oldCostPrice?.totalPrice ?? new Decimal(0)
		const oldPriceTotal = oldSellingPrice?.totalPrice ?? new Decimal(0)

		const product = await this.prisma.productMVModel.update({
			where: { id: query.id },
			data: {
				count: body.count,
				productId: body.productId,
				arrivalId: body.arrivalId,
			},
			select: {
				arrival: true,
				product: true,
				count: true,
				productMVPrices: { select: { ...MV_PRICES_SELECT, id: true } },
			},
		})

		// Update ProductMVPriceModel records
		if (oldCostPrice) {
			await this.prisma.productMVPriceModel.update({
				where: { id: oldCostPrice.id },
				data: { price: newCost, totalPrice: newCostTotal, currencyId: body.costCurrencyId ?? oldCostPrice.currency.id },
			})
		}
		if (oldSellingPrice) {
			await this.prisma.productMVPriceModel.update({
				where: { id: oldSellingPrice.id },
				data: { price: newPrice, totalPrice: newPriceTotal, currencyId: body.priceCurrencyId ?? oldSellingPrice.currency.id },
			})
		}

		// Update ArrivalTotalModel
		const costCurrencyId = body.costCurrencyId ?? oldCostPrice?.currency.id
		const priceCurrencyId = body.priceCurrencyId ?? oldSellingPrice?.currency.id

		if (oldCostPrice && costCurrencyId) {
			await this.prisma.arrivalTotalModel.update({
				where: { arrivalId_currencyId: { arrivalId: pr.arrivalId, currencyId: costCurrencyId } },
				data: { totalCost: { increment: newCostTotal.minus(oldCostTotal) } },
			})
		}
		if (oldSellingPrice && priceCurrencyId) {
			await this.prisma.arrivalTotalModel.update({
				where: { arrivalId_currencyId: { arrivalId: pr.arrivalId, currencyId: priceCurrencyId } },
				data: { totalPrice: { increment: newPriceTotal.minus(oldPriceTotal) } },
			})
		}

		await this.prisma.productModel.update({
			where: { id: product.product.id },
			data: { count: { increment: product.count - pr.count } },
		})
		await this.syncProductPrices(product.product.id, product.product.count + (product.count - pr.count), {
			selling: newPrice,
			cost: newCost,
		})

		return product
	}

	async updateOneReturning(query: ProductMVGetOneRequest, body: ReturningProductMVUpdateOneRequest) {
		const pr = await this.getOne({ id: query.id })

		const oldSellingPrice = pr.productMVPrices.find((p) => p.type === PriceTypeEnum.selling)
		const newPrice = body.price ?? oldSellingPrice?.price ?? new Decimal(0)
		const newCount = body.count ?? pr.count
		const newTotalPrice = new Decimal(newPrice).mul(newCount)
		const oldTotalPrice = oldSellingPrice?.totalPrice ?? new Decimal(0)

		const product = await this.prisma.productMVModel.update({
			where: { id: query.id },
			data: {
				count: body.count,
				productId: body.productId,
				returningId: body.returningId,
			},
			select: {
				returning: true,
				product: true,
				count: true,
				productMVPrices: { select: { ...MV_PRICES_SELECT, id: true } },
			},
		})

		// Update ProductMVPriceModel
		if (oldSellingPrice) {
			const currencyId = body.currencyId ?? oldSellingPrice.currency.id
			await this.prisma.productMVPriceModel.update({
				where: { id: oldSellingPrice.id },
				data: { price: newPrice, totalPrice: newTotalPrice, currencyId: currencyId },
			})

			// Update ReturningTotalModel
			const oldCurrencyId = oldSellingPrice.currency.id
			const newCurrencyId = body.currencyId ?? oldCurrencyId

			if (oldCurrencyId === newCurrencyId) {
				await this.prisma.returningTotalModel.update({
					where: { returningId_currencyId: { returningId: pr.returningId, currencyId: oldCurrencyId } },
					data: { total: { increment: newTotalPrice.minus(oldTotalPrice) } },
				})
			} else {
				await this.prisma.returningTotalModel.update({
					where: { returningId_currencyId: { returningId: pr.returningId, currencyId: oldCurrencyId } },
					data: { total: { decrement: oldTotalPrice } },
				})
				await this.prisma.returningTotalModel.upsert({
					where: { returningId_currencyId: { returningId: pr.returningId, currencyId: newCurrencyId } },
					update: { total: { increment: newTotalPrice } },
					create: { returningId: pr.returningId, currencyId: newCurrencyId, total: newTotalPrice },
				})
			}
		}

		if (product.returning.status === SellingStatusEnum.accepted) {
			await this.prisma.productModel.update({
				where: { id: product.product.id },
				data: { count: { increment: product.count - pr.count } },
			})
			await this.syncProductPrices(product.product.id, product.product.count + (product.count - pr.count))
		}

		return product
	}

	async deleteOne(query: ProductMVDeleteOneRequest) {
		const pr = await this.getOne({ id: query.id })

		const product = await this.prisma.productMVModel.delete({
			where: { id: query.id },
			select: {
				id: true,
				type: true,
				returning: true,
				arrival: true,
				selling: {
					select: {
						id: true,
						status: true,
						publicId: true,
						updatedAt: true,
						createdAt: true,
						deletedAt: true,
						date: true,
						totals: { select: { id: true, currencyId: true, total: true, currency: { select: { symbol: true, id: true, name: true } } } },
						client: { select: { fullname: true, phone: true, id: true, createdAt: true, telegram: true } },
						staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
						payment: { select: { total: true, id: true, card: true, cash: true, other: true, transfer: true, description: true } },
						products: {
							select: {
								createdAt: true,
								id: true,
								count: true,
								productMVPrices: { select: MV_PRICES_SELECT },
								product: { select: { name: true, id: true, createdAt: true } },
							},
						},
					},
				},
				count: true,
				product: true,
			},
		})

		if (product.type === ServiceTypeEnum.selling) {
			// Subtract from SellingTotalModel
			for (const mvPrice of pr.productMVPrices) {
				if (mvPrice.type === PriceTypeEnum.selling) {
					await this.prisma.sellingTotalModel.update({
						where: { sellingId_currencyId: { sellingId: product.selling.id, currencyId: mvPrice.currency.id } },
						data: { total: { decrement: mvPrice.totalPrice } },
					})
				}
			}
			if (product.selling && product.selling.status === SellingStatusEnum.accepted) {
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
				await this.syncProductPrices(product.product.id, product.product.count + product.count)
			}
		} else if (product.type === ServiceTypeEnum.arrival) {
			// Subtract from ArrivalTotalModel
			for (const mvPrice of pr.productMVPrices) {
				if (mvPrice.type === PriceTypeEnum.cost) {
					await this.prisma.arrivalTotalModel.update({
						where: { arrivalId_currencyId: { arrivalId: product.arrival.id, currencyId: mvPrice.currency.id } },
						data: { totalCost: { decrement: mvPrice.totalPrice } },
					})
				} else if (mvPrice.type === PriceTypeEnum.selling) {
					await this.prisma.arrivalTotalModel.update({
						where: { arrivalId_currencyId: { arrivalId: product.arrival.id, currencyId: mvPrice.currency.id } },
						data: { totalPrice: { decrement: mvPrice.totalPrice } },
					})
				}
			}
			await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
			await this.syncProductPrices(product.product.id, product.product.count - product.count)
		} else if (product.type === ServiceTypeEnum.returning) {
			// Subtract from ReturningTotalModel
			for (const mvPrice of pr.productMVPrices) {
				if (mvPrice.type === PriceTypeEnum.selling) {
					await this.prisma.returningTotalModel.update({
						where: { returningId_currencyId: { returningId: product.returning.id, currencyId: mvPrice.currency.id } },
						data: { total: { decrement: mvPrice.totalPrice } },
					})
				}
			}
			if (product.returning && product.returning.status === SellingStatusEnum.accepted) {
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
				await this.syncProductPrices(product.product.id, product.product.count + product.count)
			}
		}

		return product
	}

	async onModuleInit() {
		// await this.prisma.createActionMethods(ProductMVController)
	}
}
