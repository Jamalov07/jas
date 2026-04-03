import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common'
import { SellingRepository } from './selling.repository'
import { createResponse, CRequest, DeleteMethodEnum, ERROR_MSG } from '@common'
import { SellingStatusEnum, ServiceTypeEnum, UserTypeEnum } from '@prisma/client'
import {
	SellingGetOneRequest,
	SellingCreateOneRequest,
	SellingUpdateOneRequest,
	SellingGetManyRequest,
	SellingFindManyRequest,
	SellingFindOneRequest,
	SellingDeleteOneRequest,
	SellingGetTotalStatsRequest,
	SellingGetPeriodStatsRequest,
	TotalStatsByCurrency,
} from './interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { ArrivalService } from '../arrival'
import { ClientService } from '../client'
import { ExcelService } from '../shared/excel'
import { Response } from 'express'
import { BotService } from '../bot'
import { BotSellingProductTitleEnum, BotSellingTitleEnum } from './enums'
import { PrismaService } from '../shared'
import pLimit from 'p-limit'
import { CommonService } from '../common'

@Injectable()
export class SellingService {
	constructor(
		private readonly sellingRepository: SellingRepository,
		@Inject(forwardRef(() => ArrivalService)) private readonly arrivalService: ArrivalService,
		private readonly clientService: ClientService,
		private readonly commonService: CommonService,
		private readonly excelService: ExcelService,
		private readonly botService: BotService,
		private readonly prisma: PrismaService,
	) {}

	async findMany(query: SellingFindManyRequest) {
		const sellings = await this.sellingRepository.findMany(query)
		const sellingsCount = await this.sellingRepository.countFindMany(query)

		const calc = {
			totalPayment: new Decimal(0),
			totalCardPayment: new Decimal(0),
			totalCashPayment: new Decimal(0),
			totalOtherPayment: new Decimal(0),
			totalTransferPayment: new Decimal(0),
		}

		const mappedSellings = sellings.map((selling) => {
			calc.totalPayment = calc.totalPayment.plus(selling.payment.total)
			calc.totalCardPayment = calc.totalCardPayment.plus(selling.payment.card)
			calc.totalCashPayment = calc.totalCashPayment.plus(selling.payment.cash)
			calc.totalOtherPayment = calc.totalOtherPayment.plus(selling.payment.other)
			calc.totalTransferPayment = calc.totalTransferPayment.plus(selling.payment.transfer)

			return {
				...selling,
				payment: selling.payment.total.toNumber() ? selling.payment : null,
				totalPayment: selling.payment.total,
				totalPrices: selling.totals,
			}
		})

		const result = query.pagination
			? {
					totalCount: sellingsCount,
					pagesCount: Math.ceil(sellingsCount / query.pageSize),
					pageSize: sellings.length,
					data: mappedSellings,
					calc: calc,
				}
			: { data: mappedSellings, calc: calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async excelDownloadMany(res: Response, query: SellingFindManyRequest) {
		return this.excelService.sellingDownloadMany(res, query)
	}

	async findOne(query: SellingFindOneRequest) {
		const selling = await this.sellingRepository.findOne(query)

		if (!selling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		return createResponse({
			data: { ...selling, totalPayment: selling.payment.total, totalPrices: selling.totals },
			success: { messages: ['find one success'] },
		})
	}

	async excelDownloadOne(res: Response, query: SellingFindOneRequest) {
		return this.excelService.sellingDownloadOne(res, query)
	}

	async getMany(query: SellingGetManyRequest) {
		const sellings = await this.sellingRepository.getMany(query)
		const sellingsCount = await this.sellingRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(sellingsCount / query.pageSize),
					pageSize: sellings.length,
					data: sellings,
				}
			: { data: sellings }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: SellingGetOneRequest) {
		const selling = await this.sellingRepository.getOne(query)

		if (!selling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		return createResponse({ data: selling, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: SellingCreateOneRequest) {
		let client = await this.clientService.findOne({ id: body.clientId })

		let total = new Decimal(0)
		if (body.payment) {
			if (Object.values(body.payment).some((value) => value !== 0)) {
				body.status = SellingStatusEnum.accepted
				if (body.date) {
					const inputDate = new Date(body.date)
					const now = new Date()
					const isToday =
						inputDate.getFullYear() === now.getFullYear() && inputDate.getMonth() === now.getMonth() && inputDate.getDate() === now.getDate()
					if (isToday) {
						body.date = now
					} else {
						body.date = new Date(inputDate.setHours(0, 0, 0, 0))
					}
				} else {
					body.date = new Date()
				}
			}

			total = new Decimal(body.payment.card ?? 0)
				.plus(body.payment.cash ?? 0)
				.plus(body.payment.other ?? 0)
				.plus(body.payment.transfer ?? 0)
		}

		if (body.status === SellingStatusEnum.accepted) {
			const dayClose = await this.commonService.getDayClose({})
			if (dayClose.data.isClosed) {
				const tomorrow = new Date()
				tomorrow.setDate(tomorrow.getDate() + 1)
				tomorrow.setHours(0, 0, 0, 0)
				body.date = tomorrow
			} else {
				body.date = new Date()
			}
		}

		body = {
			...body,
			staffId: request.user.id,
			payment: { ...body.payment, total: total },
		}

		const selling = await this.sellingRepository.createOne(body)

		if (body.send) {
			if (selling.status === SellingStatusEnum.accepted) {
				client = await this.clientService.findOne({ id: body.clientId })
				const sellingInfo = {
					...selling,
					client: client.data,
					title: BotSellingTitleEnum.new,
					totalPayment: total,
					totalPrices: selling.totals,
					products: selling.products.map((p) => ({
						...p,
						status: BotSellingProductTitleEnum.new,
					})),
				} as any

				if (client.data.telegram?.id) {
					await this.botService.sendSellingToClient(sellingInfo).catch((e) => {
						console.log('user', e)
					})
				}
				await this.botService.sendSellingToChannel(sellingInfo).catch((e) => {
					console.log('channel', e)
				})

				if (!total.isZero()) {
					await this.botService.sendPaymentToChannel(sellingInfo.payment, false, client.data)
				}
			}
		}

		return createResponse({ data: selling, success: { messages: ['create one success'] } })
	}

	async updateOne(request: CRequest, query: SellingGetOneRequest, body: SellingUpdateOneRequest) {
		const selling = await this.getOne(query)

		if (selling.data.status === SellingStatusEnum.accepted) {
			body.date = undefined
		}

		let total = new Decimal(0)
		let shouldSend = true
		let isFirstSend = false

		const hasValidPayment = body.payment && ['card', 'cash', 'other', 'transfer'].some((key) => !!body.payment?.[key] && +body.payment[key] !== 0)

		if (body.status !== SellingStatusEnum.accepted) {
			if (hasValidPayment) {
				body.status = SellingStatusEnum.accepted
				body.date = new Date()
				total = new Decimal(body.payment?.card ?? 0)
					.plus(body.payment?.cash ?? 0)
					.plus(body.payment?.other ?? 0)
					.plus(body.payment?.transfer ?? 0)
			}
		} else {
			if (selling.data.status !== SellingStatusEnum.accepted) {
				isFirstSend = true
			}
			body.date = new Date()
			shouldSend = true
			total = new Decimal(body.payment?.card ?? 0)
				.plus(body.payment?.cash ?? 0)
				.plus(body.payment?.other ?? 0)
				.plus(body.payment?.transfer ?? 0)
		}

		body = {
			...body,
			status: body.status,
			staffId: request.user.id || selling.data.staff.id,
			payment: hasValidPayment
				? { ...body.payment, total: total }
				: selling.data.payment,
		}

		const updatedSelling = await this.sellingRepository.updateOne(query, body)

		const client = await this.clientService.findOne({ id: selling.data.client.id })

		const sellingInfo = {
			...updatedSelling,
			client: client.data,
			title: isFirstSend ? BotSellingTitleEnum.new : undefined,
			totalPayment: total,
			totalPrices: updatedSelling.totals,
			products: updatedSelling.products.map((p) => ({
				...p,
				status: BotSellingProductTitleEnum.new,
			})),
		} as any

		console.log(shouldSend, selling.data.status, body.status, updatedSelling.status, total, sellingInfo.payment.total)

		if (selling.data.status === SellingStatusEnum.accepted || body.status === SellingStatusEnum.accepted || updatedSelling.status === SellingStatusEnum.accepted) {
			if (body.send) {
				if (updatedSelling.client?.telegram?.id) {
					await this.botService.sendSellingToClient(sellingInfo).catch(console.log)
				}
			}
			const wasAccepted = selling.data.status === SellingStatusEnum.accepted
			const prevPaymentTotal = selling.data.payment?.total ?? new Decimal(0)
			const isAcceptedNow = updatedSelling.status === SellingStatusEnum.accepted
			const newPaymentTotal = updatedSelling.payment?.total ?? new Decimal(0)
			const paymentChanged = !prevPaymentTotal.equals(newPaymentTotal)
			const hadPaymentBefore = !prevPaymentTotal.isZero()
			const shouldSendPayment =
				(!wasAccepted && isAcceptedNow && !newPaymentTotal.isZero()) || (wasAccepted && paymentChanged)
			const isModified = hadPaymentBefore && paymentChanged

			await this.botService.sendSellingToChannel(sellingInfo).catch(console.log)

			if (shouldSendPayment) {
				await this.botService.sendPaymentToChannel(sellingInfo.payment, isModified, client.data)
			}
		}

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: SellingDeleteOneRequest) {
		const selling = await this.findOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.sellingRepository.deleteOne(query)
			const client = await this.clientService.findOne({ id: selling.data.client.id })
		const sellingInfo = {
			...selling.data,
			products: selling.data.products,
			client: client.data,
		} as any
		if (selling.data.status === SellingStatusEnum.accepted) {
			await this.botService.sendDeletedSellingToChannel(sellingInfo)
				const totalPayment = selling.data.payment.card.plus(selling.data.payment.cash).plus(selling.data.payment.other).plus(selling.data.payment.transfer)
				if (totalPayment.toNumber()) {
					await this.botService.sendDeletedPaymentToChannel(selling.data.payment, client.data)
				}
			}
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async getTotalStats(query: SellingGetTotalStatsRequest) {
		const now = new Date()

		const getDateRange = (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
			const start = new Date(now)
			const end = new Date(now)
			if (type === 'weekly') {
				start.setDate(now.getDate() - now.getDay())
				end.setDate(start.getDate() + 6)
			} else if (type === 'monthly') {
				start.setDate(1)
				end.setMonth(start.getMonth() + 1, 0)
			} else if (type === 'yearly') {
				start.setMonth(0, 1)
				end.setMonth(11, 31)
			}
			return { startDate: start, endDate: end }
		}

		const statTypes = ['daily', 'weekly', 'monthly', 'yearly'] as const
		const limit = pLimit(2)

		const statsPromises = statTypes.map((type) =>
			limit(async () => {
				const { startDate, endDate } = getDateRange(type)
				const totals = await this.prisma.sellingTotalModel.findMany({
					where: {
						selling: {
							date: {
								gte: new Date(new Date(startDate).setHours(0, 0, 0, 0)),
								lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
							},
							client: { deletedAt: null },
							status: SellingStatusEnum.accepted,
						},
					},
					select: { total: true, currencyId: true, currency: { select: { symbol: true } } },
				})

				const map = new Map<string, TotalStatsByCurrency>()
				for (const t of totals) {
					const existing = map.get(t.currencyId)
					if (existing) {
						existing.total = existing.total.plus(t.total)
					} else {
						map.set(t.currencyId, { currencyId: t.currencyId, symbol: t.currency.symbol, total: new Decimal(t.total) })
					}
				}
				return Array.from(map.values())
			}),
		)

		const [daily, weekly, monthly, yearly] = await Promise.all(statsPromises)

		const supplierDebt = await this.getSupplierDebtStats()
		const clientDebt = await this.getClientDebtStats()

		return createResponse({
			data: { daily, weekly, monthly, yearly, client: clientDebt, supplier: supplierDebt },
			success: { messages: ['get total stats success'] },
		})
	}

	private async getClientDebtStats() {
		const clients = await this.prisma.userModel.findMany({
			where: { type: UserTypeEnum.client, deletedAt: null },
			select: {
				balance: true,
				sellings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						totals: { select: { total: true } },
						payment: { select: { total: true } },
					},
				},
				returnings: {
					where: { status: SellingStatusEnum.accepted },
					select: { payment: { select: { fromBalance: true } } },
				},
			},
		})

		let theirDebt = new Decimal(0)
		let ourDebt = new Decimal(0)

		for (const c of clients) {
			const sellingDebt = c.sellings.reduce((acc, s) => {
				const sellingTotal = s.totals.reduce((sum, t) => sum.plus(t.total), new Decimal(0))
				return acc.plus(sellingTotal).minus(s.payment.total)
			}, new Decimal(0))

			c.returnings.map((returning) => {
				c.balance = c.balance.minus(returning.payment.fromBalance)
			})

			const totalDebt = sellingDebt.plus(c.balance ?? 0)

			if (totalDebt.gt(0)) {
				theirDebt = theirDebt.plus(totalDebt)
			} else if (totalDebt.lt(0)) {
				ourDebt = ourDebt.plus(totalDebt.abs())
			}
		}

		return { theirDebt, ourDebt }
	}

	private async getSupplierDebtStats() {
		const suppliers = await this.prisma.userModel.findMany({
			where: { type: UserTypeEnum.supplier, deletedAt: null },
			select: {
				balance: true,
				arrivals: {
					where: { deletedAt: null },
					select: {
						totals: { select: { totalCost: true } },
						payment: { select: { total: true } },
					},
				},
			},
		})

		let ourDebt = new Decimal(0)
		let theirDebt = new Decimal(0)

		for (const s of suppliers) {
			const arrivalDebt = s.arrivals.reduce((acc, a) => {
				const costTotal = a.totals.reduce((sum, t) => sum.plus(t.totalCost), new Decimal(0))
				return acc.plus(costTotal).minus(a.payment?.total ?? 0)
			}, new Decimal(0))

			const totalDebt = s.balance.plus(arrivalDebt ?? 0)

			if (totalDebt.gt(0)) {
				ourDebt = ourDebt.plus(totalDebt)
			} else if (totalDebt.lt(0)) {
				theirDebt = theirDebt.plus(totalDebt.abs())
			}
		}

		return { ourDebt, theirDebt }
	}

	async getPeriodStats(query: SellingGetPeriodStatsRequest) {
		const result = await this.sellingRepository.getPeriodStats(query)
		return createResponse({ data: result, success: { messages: ['get period stats success'] } })
	}
}
