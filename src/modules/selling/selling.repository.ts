import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	SellingCreateOneRequest,
	SellingDeleteOneRequest,
	SellingFindManyRequest,
	SellingFindOneRequest,
	SellingGetManyRequest,
	SellingGetOneRequest,
	SellingGetPeriodStatsRequest,
	SellingUpdateOneRequest,
} from './interfaces'
import { SellingController } from './selling.controller'
import { PriceTypeEnum, SellingStatusEnum, ServiceTypeEnum } from '@prisma/client'
import { StatsTypeEnum } from './enums'
import { convertUTCtoLocal, extractDateParts } from '../../common'
import { Decimal } from '@prisma/client/runtime/library'

const TOTALS_SELECT = {
	id: true,
	currencyId: true,
	total: true,
	currency: { select: { id: true, symbol: true, name: true } },
}

@Injectable()
export class SellingRepository implements OnModuleInit {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
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
			select: {
				id: true,
				status: true,
				totals: { select: TOTALS_SELECT },
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				client: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: {
					select: {
						staff: { select: { phone: true, fullname: true } },
						id: true,
						total: true,
						card: true,
						cash: true,
						other: true,
						transfer: true,
						description: true,
						createdAt: true,
					},
				},
				products: {
					orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
					select: {
						createdAt: true,
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } }, type: true } },
						product: { select: { name: true, id: true, createdAt: true } },
					},
				},
			},
			...paginationOptions,
		})

		return sellings
	}

	async findOne(query: SellingFindOneRequest) {
		const selling = await this.prisma.sellingModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				status: true,
				publicId: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				totals: { select: TOTALS_SELECT },
				client: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { total: true, type: true, id: true, card: true, cash: true, other: true, transfer: true, description: true, createdAt: true } },
				products: {
					orderBy: [{ createdAt: 'desc' }],
					select: {
						createdAt: true,
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } }, type: true } },
						product: { select: { productPrices: true, id: true, createdAt: true, name: true } },
					},
				},
			},
		})

		return selling
	}

	async countFindMany(query: SellingFindManyRequest) {
		const sellingsCount = await this.prisma.sellingModel.count({
			where: {
				status: query.status,
				staffId: query.staffId,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { gte: query.startDate, lte: query.endDate },
			},
		})

		return sellingsCount
	}

	async getMany(query: SellingGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const sellings = await this.prisma.sellingModel.findMany({
			where: {
				id: { in: query.ids },
				status: query.status,
				date: { gte: query.startDate, lte: query.endDate },
			},
			select: {
				id: true,
				status: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				totals: { select: TOTALS_SELECT },
				date: true,
				client: {
					select: {
						id: true,
						balance: true,
						fullname: true,
						phone: true,
						payments: {
							where: { type: ServiceTypeEnum.client },
							select: { total: true, card: true, cash: true, other: true, transfer: true },
						},
					},
				},
				staff: true,
				payment: true,
				products: {
					select: {
						createdAt: true,
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } }, type: true } },
						product: { select: { name: true, id: true, createdAt: true } },
					},
				},
			},
			...paginationOptions,
		})

		return sellings
	}

	async getOne(query: SellingGetOneRequest) {
		const selling = await this.prisma.sellingModel.findFirst({
			where: { id: query.id, status: query.status, staffId: query.staffId },
			select: {
				id: true,
				status: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				totals: { select: TOTALS_SELECT },
				client: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { total: true, id: true, card: true, cash: true, other: true, transfer: true, description: true, createdAt: true } },
				products: {
					orderBy: [{ createdAt: 'desc' }],
					select: {
						createdAt: true,
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } }, type: true } },
						product: { select: { id: true, createdAt: true, name: true } },
					},
				},
			},
		})

		return selling
	}

	async countGetMany(query: SellingGetManyRequest) {
		const sellingsCount = await this.prisma.sellingModel.count({
			where: {
				id: { in: query.ids },
				status: query.status,
			},
		})

		return sellingsCount
	}

	async createOne(body: SellingCreateOneRequest) {
		const today = new Date()
		const dayClose = await this.prisma.dayCloseLog.findFirst({ where: { closedDate: today } })

		if (dayClose) {
			const tomorrow = new Date(today)
			tomorrow.setDate(today.getDate() + 1)
			tomorrow.setHours(0, 0, 0, 0)
			body.date = tomorrow
		}

		// Pre-fetch exchange rates
		const currencyIds = [...new Set((body.products ?? []).map((p) => p.currencyId))]
		const currencies = await this.prisma.currencyModel.findMany({
			where: { id: { in: currencyIds } },
			select: { id: true, exchangeRate: true },
		})
		const currencyExchangeMap = Object.fromEntries(currencies.map((c) => [c.id, c.exchangeRate]))

		// Create selling with nested product MVs and prices
		const selling = await this.prisma.sellingModel.create({
			data: {
				status: body.status,
				clientId: body.clientId,
				date: dayClose ? body.date : undefined,
				staffId: body.staffId,
				createdAt: dayClose ? body.date : undefined,
				payment: {
					create: {
						total: body.payment.total,
						card: body.payment?.card,
						cash: body.payment?.cash,
						other: body.payment?.other,
						transfer: body.payment?.transfer,
						description: body.payment?.description,
						userId: body.clientId,
						staffId: body.staffId,
						type: ServiceTypeEnum.selling,
						createdAt: dayClose ? body.date : undefined,
					},
				},
				products: {
					create: (body.products ?? []).map((p) => ({
						productId: p.productId,
						type: ServiceTypeEnum.selling,
						count: p.count,
						staffId: body.staffId,
						createdAt: dayClose ? body.date : undefined,
						productMVPrices: {
							create: {
								type: PriceTypeEnum.selling,
								price: p.price,
								totalPrice: new Decimal(p.price).mul(p.count),
								currencyId: p.currencyId,
								exchangeRate: currencyExchangeMap[p.currencyId] ?? 0,
							},
						},
					})),
				},
			},
			select: {
				id: true,
				status: true,
				publicId: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				client: { select: { fullname: true, phone: true, id: true, createdAt: true, telegram: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { total: true, id: true, card: true, cash: true, other: true, type: true, transfer: true, description: true, createdAt: true } },
				products: {
					orderBy: { createdAt: 'desc' },
					select: {
						createdAt: true,
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } }, type: true } },
						product: { select: { productPrices: true, name: true, id: true, createdAt: true } },
					},
				},
			},
		})

		// Upsert SellingTotalModel for each currency
		for (const product of selling.products) {
			for (const mvPrice of product.productMVPrices) {
				await this.prisma.sellingTotalModel.upsert({
					where: { sellingId_currencyId: { sellingId: selling.id, currencyId: mvPrice.currencyId } },
					update: { total: { increment: mvPrice.totalPrice } },
					create: { sellingId: selling.id, currencyId: mvPrice.currencyId, total: mvPrice.totalPrice },
				})
			}
		}

		// Decrement product counts if accepted
		if (body.status === SellingStatusEnum.accepted) {
			for (const product of selling.products) {
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
			}
		}

		// Return with totals
		return this.prisma.sellingModel.findFirst({
			where: { id: selling.id },
			select: {
				id: true,
				status: true,
				publicId: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				totals: { select: TOTALS_SELECT },
				client: { select: { fullname: true, phone: true, id: true, createdAt: true, telegram: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { total: true, id: true, card: true, cash: true, other: true, type: true, transfer: true, description: true, createdAt: true } },
				products: {
					orderBy: { createdAt: 'desc' },
					select: {
						createdAt: true,
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } }, type: true } },
						product: { select: { productPrices: true, name: true, id: true, createdAt: true } },
					},
				},
			},
		})
	}

	async updateOne(query: SellingGetOneRequest, body: SellingUpdateOneRequest) {
		const existSelling = await this.findOne(query)

		const selling = await this.prisma.sellingModel.update({
			where: { id: query.id },
			data: {
				date: existSelling.status !== SellingStatusEnum.accepted ? (body.date ? new Date(body.date) : undefined) : undefined,
				status: body.status,
				clientId: body.clientId,
				deletedAt: body.deletedAt,
				payment: {
					update: {
						total: body.payment.total,
						card: body.payment?.card,
						cash: body.payment?.cash,
						other: body.payment?.other,
						transfer: body.payment?.transfer,
						description: body.payment?.description,
						staffId: body.payment.total ? body.staffId : undefined,
						createdAt: !existSelling.payment.total.isZero() ? undefined : new Date(),
					},
				},
			},
			select: {
				id: true,
				status: true,
				publicId: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
				date: true,
				totals: { select: TOTALS_SELECT },
				client: { select: { fullname: true, phone: true, id: true, createdAt: true, telegram: true } },
				staff: { select: { fullname: true, phone: true, id: true, createdAt: true } },
				payment: { select: { total: true, id: true, card: true, cash: true, other: true, type: true, transfer: true, description: true, createdAt: true } },
				products: {
					orderBy: { createdAt: 'desc' },
					select: {
						createdAt: true,
						id: true,
						count: true,
						productMVPrices: { select: { price: true, totalPrice: true, currencyId: true, currency: { select: { symbol: true } }, type: true } },
						product: { select: { productPrices: true, name: true, id: true, createdAt: true } },
					},
				},
			},
		})

		await this.prisma.sellingModel.update({
			where: { id: selling.id },
			data: { payment: { update: { total: selling.payment.card.plus(selling.payment.cash).plus(selling.payment.other).plus(selling.payment.transfer) } } },
		})

		if (body.status === SellingStatusEnum.accepted && existSelling.status !== SellingStatusEnum.accepted) {
			const sellingDate = body.date ? new Date(body.date) : new Date()

			const sortedProducts = [...selling.products].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

			for (let i = 0; i < sortedProducts.length; i++) {
				const product = sortedProducts[sortedProducts.length - 1 - i]
				const newDate = new Date(sellingDate.getTime() - i * 1000)
				await this.prisma.productMVModel.update({ where: { id: product.id }, data: { createdAt: newDate } })
			}

			for (const product of selling.products) {
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { decrement: product.count } } })
			}
		}

		return selling
	}

	async deleteOne(query: SellingDeleteOneRequest) {
		const selling = await this.prisma.sellingModel.delete({
			where: { id: query.id },
			select: { products: { select: { product: true, count: true } }, status: true },
		})

		if (selling.status === SellingStatusEnum.accepted) {
			for (const product of selling.products) {
				await this.prisma.productModel.update({ where: { id: product.product.id }, data: { count: { increment: product.count } } })
			}
		}

		return selling
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(SellingController)
	}

	async getPeriodStats(query: SellingGetPeriodStatsRequest) {
		if (query.type === StatsTypeEnum.day) {
			return this.getDayStats()
		} else if (query.type === StatsTypeEnum.week) {
			return this.getWeekStats()
		} else if (query.type === StatsTypeEnum.month) {
			return this.getMonthStats()
		} else if (query.type === StatsTypeEnum.year) {
			return this.getYearStats()
		}
	}

	private groupTotalsByCurrency(totals: { total: Decimal; currency: { id: string; symbol: string } }[]) {
		const map = new Map<string, { currencyId: string; symbol: string; total: Decimal }>()
		for (const t of totals) {
			const existing = map.get(t.currency.id)
			if (existing) {
				existing.total = existing.total.plus(t.total)
			} else {
				map.set(t.currency.id, { currencyId: t.currency.id, symbol: t.currency.symbol, total: new Decimal(t.total) })
			}
		}
		return Array.from(map.values())
	}

	private async getDayStats() {
		const now = convertUTCtoLocal(new Date())
		const extractedNow = extractDateParts(now)

		const salesByHour = []
		for (let hour = 0; hour <= now.getHours(); hour++) {
			const hourStart = convertUTCtoLocal(new Date(extractedNow.year, extractedNow.month, extractedNow.day, hour, 0, 0, 0))
			const hourEnd = convertUTCtoLocal(new Date(extractedNow.year, extractedNow.month, extractedNow.day, hour, 59, 59, 999))

			const totals = await this.prisma.sellingTotalModel.findMany({
				where: { selling: { createdAt: { gte: hourStart, lte: hourEnd } } },
				select: { total: true, currency: { select: { id: true, symbol: true } } },
			})

			const start = extractDateParts(hourStart)
			salesByHour.push({
				date: `${String(start.hour).padStart(2, '0')}:${String(start.minute).padStart(2, '0')}`,
				sums: this.groupTotalsByCurrency(totals),
			})
		}
		return salesByHour
	}

	async getWeekStats() {
		const now = convertUTCtoLocal(new Date())
		const extractedNow = extractDateParts(now)

		const startDay = convertUTCtoLocal(new Date(extractedNow.year, extractedNow.month, extractedNow.day - 6, 0, 0, 0, 0))
		const endDay = convertUTCtoLocal(new Date(extractedNow.year, extractedNow.month, extractedNow.day, 23, 59, 59, 999))

		const salesByDay = []
		for (let current = new Date(startDay); current <= endDay; current.setDate(current.getDate() + 1)) {
			const dayStart = convertUTCtoLocal(new Date(current.getFullYear(), current.getMonth(), current.getDate(), 0, 0, 0, 0))
			const dayEnd = convertUTCtoLocal(new Date(current.getFullYear(), current.getMonth(), current.getDate(), 23, 59, 59, 999))

			const totals = await this.prisma.sellingTotalModel.findMany({
				where: { selling: { createdAt: { gte: dayStart, lte: dayEnd } } },
				select: { total: true, currency: { select: { id: true, symbol: true } } },
			})

			salesByDay.push({
				date: `${dayStart.getFullYear()}-${String(dayStart.getMonth() + 1).padStart(2, '0')}-${String(dayStart.getDate()).padStart(2, '0')}`,
				sums: this.groupTotalsByCurrency(totals),
			})
		}
		return salesByDay
	}

	async getMonthStats() {
		const now = new Date(new Date().setHours(new Date().getHours() + 5))
		const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0 + 5, 0, 0, 0)
		const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
		const dateFormat = (date: Date) => date.toISOString().split('T')[0]

		const salesByDay = []
		for (let day = 1; day <= endDate.getDate(); day++) {
			const dayStart = new Date(startDate)
			dayStart.setDate(day)
			const dayEnd = new Date(dayStart)
			dayEnd.setHours(23, 59, 59, 999)

			const totals = await this.prisma.sellingTotalModel.findMany({
				where: { selling: { createdAt: { gte: dayStart, lte: dayEnd } } },
				select: { total: true, currency: { select: { id: true, symbol: true } } },
			})

			salesByDay.push({
				date: dateFormat(dayStart),
				sums: this.groupTotalsByCurrency(totals),
			})
		}
		return salesByDay
	}

	async getYearStats() {
		const now = new Date(new Date().setHours(new Date().getHours() + 5))
		const startDate = new Date(now.getFullYear(), 0, 1, 0 + 5, 0, 0, 0)
		const dateFormat = (date: Date) => date.toISOString().split('T')[0].slice(0, 7)

		const salesByMonth = []
		for (let month = 0; month < 12; month++) {
			const monthStart = new Date(startDate.getFullYear(), month, 1, 0 + 5, 0, 0, 0)
			const monthEnd = new Date(startDate.getFullYear(), month + 1, 0, 23 + 5, 59, 59, 999)

			const totals = await this.prisma.sellingTotalModel.findMany({
				where: { selling: { createdAt: { gte: monthStart, lte: monthEnd } } },
				select: { total: true, currency: { select: { id: true, symbol: true } } },
			})

			salesByMonth.push({
				date: dateFormat(monthStart),
				sums: this.groupTotalsByCurrency(totals),
			})
		}
		return salesByMonth
	}
}
