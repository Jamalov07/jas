import { BadRequestException, Injectable } from '@nestjs/common'
import { SellingRepository } from './selling.repository'
import { createResponse, CRequest, ERROR_MSG } from '@common'
import { SellingStatusEnum } from '@prisma/client'
import {
	SellingGetOneRequest,
	SellingCreateOneRequest,
	SellingUpdateOneRequest,
	SellingGetManyRequest,
	SellingFindManyRequest,
	SellingFindOneRequest,
	SellingDeleteOneRequest,
	SellingCalcEntry,
	SellingPaymentData,
} from './interfaces'
import { PaymentMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { CommonService } from '../common'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { BotService } from '../bot'
import { BotSellingProductTitleEnum, BotSellingTitleEnum } from './enums'
import { ClientService } from '../client'

@Injectable()
export class SellingService {
	constructor(
		private readonly sellingRepository: SellingRepository,
		private readonly commonService: CommonService,
		private readonly excelService: ExcelService,
		private readonly botService: BotService,
		private readonly clientService: ClientService,
	) {}

	private calcTotalPricesFromProducts(products: { prices: { type: string; currencyId: string; totalPrice: Decimal; currency?: { symbol: string } }[] }[]) {
		const map = new Map<string, { total: Decimal; currency?: { symbol: string } }>()
		for (const product of products) {
			for (const price of product.prices) {
				if (price.type === 'selling') {
					const existing = map.get(price.currencyId) ?? { total: new Decimal(0), currency: price.currency }
					map.set(price.currencyId, { total: existing.total.plus(price.totalPrice), currency: existing.currency || price.currency })
				}
			}
		}
		return Array.from(map.entries()).map(([currencyId, { total, currency }]) => ({ currencyId, total, currency }))
	}

	private buildPaymentData(
		csp: { id: string; description?: string | null; createdAt: Date; methods: { type: string; currencyId: string; amount: Decimal }[] } | null | undefined,
	): SellingPaymentData | undefined {
		if (!csp) return undefined
		return {
			id: csp.id,
			description: csp.description,
			paymentMethods: csp.methods as any,
			createdAt: csp.createdAt,
		}
	}

	private calcPaymentTotal(csp: { methods: { amount: Decimal }[] } | null | undefined): Decimal {
		return csp?.methods?.reduce((acc, m) => acc.plus(m.amount), new Decimal(0)) ?? new Decimal(0)
	}

	private calcDebtByCurrency(totalPrices: { currencyId: string; total: Decimal; currency?: { symbol: string } }[], payment: SellingPaymentData | undefined) {
		const debtMap = new Map<string, { amount: Decimal; symbol?: string }>()

		for (const tp of totalPrices) {
			debtMap.set(tp.currencyId, { amount: tp.total, symbol: tp.currency?.symbol })
		}

		for (const method of (payment?.paymentMethods as any[]) ?? []) {
			if (method.type === PaymentMethodEnum.fromCash || method.type === PaymentMethodEnum.fromBalance) continue
			const existing = debtMap.get(method.currencyId)
			const symbol = existing?.symbol ?? method.currency?.symbol
			debtMap.set(method.currencyId, { amount: (existing?.amount ?? new Decimal(0)).minus(method.amount), symbol })
		}

		return Array.from(debtMap.entries()).map(([currencyId, { amount, symbol }]) => ({ currencyId, amount, currency: { symbol: symbol ?? '' } }))
	}

	async findMany(query: SellingFindManyRequest) {
		const sellings = await this.sellingRepository.findMany(query)
		const sellingsCount = await this.sellingRepository.countFindMany(query)

		const calcMap = new Map<string, Decimal>()
		const mappedSellings = sellings.map((selling) => {
			for (const method of selling.payment?.methods ?? []) {
				const key = `${method.type}_${method.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(method.amount))
			}

			const totalPrices = this.calcTotalPricesFromProducts(selling.products)
			const payment = this.buildPaymentData(selling.payment)
			const debtByCurrency = this.calcDebtByCurrency(totalPrices, payment)

			return { ...selling, payment, totalPrices, debtByCurrency }
		})

		const calc: SellingCalcEntry[] = Array.from(calcMap.entries()).map(([key, total]) => {
			const [type, currencyId] = key.split('_')
			return { type: type as PaymentMethodEnum, currencyId, total }
		})

		const result = query.pagination
			? { totalCount: sellingsCount, pagesCount: Math.ceil(sellingsCount / query.pageSize), pageSize: sellings.length, data: mappedSellings, calc }
			: { data: mappedSellings, calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: SellingFindOneRequest) {
		const selling = await this.sellingRepository.findOne(query)

		if (!selling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		const totalPrices = this.calcTotalPricesFromProducts(selling.products)
		const payment = this.buildPaymentData(selling.payment)
		const debtByCurrency = this.calcDebtByCurrency(totalPrices, payment)

		return createResponse({
			data: { ...selling, payment, totalPrices, debtByCurrency },
			success: { messages: ['find one success'] },
		})
	}

	async getMany(query: SellingGetManyRequest) {
		const sellings = await this.sellingRepository.getMany(query)
		const sellingsCount = await this.sellingRepository.countGetMany(query)

		const result = query.pagination ? { pagesCount: Math.ceil(sellingsCount / query.pageSize), pageSize: sellings.length, data: sellings } : { data: sellings }

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
		if (body.payment?.paymentMethods?.length) {
			body.status = SellingStatusEnum.accepted
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
		} else if (body.date) {
			const inputDate = new Date(body.date)
			const now = new Date()
			const isToday = inputDate.getFullYear() === now.getFullYear() && inputDate.getMonth() === now.getMonth() && inputDate.getDate() === now.getDate()
			body.date = isToday ? now : new Date(inputDate.setHours(0, 0, 0, 0))
		}

		body.staffId = request.user.id

		const selling = await this.sellingRepository.createOne(body)

		if (body.send && selling.status === SellingStatusEnum.accepted) {
			try {
				const clientResult = await this.clientService.findOne({ id: body.clientId })
				const totalPrices = this.calcTotalPricesFromProducts(selling.products)
				const payment = this.buildPaymentData(selling.payment)

				const sellingInfo = {
					...selling,
					client: clientResult.data,
					title: BotSellingTitleEnum.new,
					totalPrices,
					payment,
					products: selling.products.map((p) => ({ ...p, status: BotSellingProductTitleEnum.new })),
				} as any

				if (clientResult.data.telegram?.id) {
					await this.botService.sendSellingToClient(sellingInfo).catch((e) => console.log('bot client error:', e))
				}
				await this.botService.sendSellingToChannel(sellingInfo).catch((e) => console.log('bot channel error:', e))

				if (payment?.paymentMethods?.length) {
					await this.botService.sendPaymentToChannel(payment, false, clientResult.data).catch((e) => console.log('bot payment error:', e))
				}
			} catch (e) {
				console.log('bot send error:', e)
			}
		}

		const data = { ...selling, payment: this.buildPaymentData(selling.payment) }
		return createResponse({ data, success: { messages: ['create one success'] } })
	}

	async updateOne(request: CRequest, query: SellingGetOneRequest, body: SellingUpdateOneRequest) {
		const existingSelling = await this.sellingRepository.findOne({ id: query.id })
		if (!existingSelling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		body.staffId = request.user.id

		await this.sellingRepository.updateOne(query, body)

		const updatedSelling = await this.sellingRepository.findOne({ id: query.id })
		const wasAccepted = existingSelling.status === SellingStatusEnum.accepted
		const isAcceptedNow = updatedSelling.status === SellingStatusEnum.accepted

		if (wasAccepted || isAcceptedNow) {
			try {
				const clientResult = await this.clientService.findOne({ id: existingSelling.client.id })
				const totalPrices = this.calcTotalPricesFromProducts(updatedSelling.products)
				const payment = this.buildPaymentData(updatedSelling.payment)
				const isFirstAccept = !wasAccepted && isAcceptedNow

				const sellingInfo = {
					...updatedSelling,
					client: clientResult.data,
					title: isFirstAccept ? BotSellingTitleEnum.new : BotSellingTitleEnum.updated,
					totalPrices,
					payment,
					products: updatedSelling.products.map((p) => ({ ...p, status: BotSellingProductTitleEnum.new })),
				} as any

				if (body.send && clientResult.data.telegram?.id) {
					await this.botService.sendSellingToClient(sellingInfo).catch((e) => console.log('bot client error:', e))
				}

				await this.botService.sendSellingToChannel(sellingInfo).catch((e) => console.log('bot channel error:', e))

				const prevPaymentTotal = this.calcPaymentTotal(existingSelling.payment)
				const newPaymentTotal = this.calcPaymentTotal(updatedSelling.payment)
				const paymentChanged = !prevPaymentTotal.equals(newPaymentTotal)
				const hadPaymentBefore = !prevPaymentTotal.isZero()
				const isModified = hadPaymentBefore && paymentChanged

				const shouldSendPayment = (isFirstAccept && payment?.paymentMethods?.length) || (wasAccepted && paymentChanged && payment?.paymentMethods?.length)

				if (shouldSendPayment) {
					await this.botService.sendPaymentToChannel(payment, isModified, clientResult.data).catch((e) => console.log('bot payment error:', e))
				}
			} catch (e) {
				console.log('bot send error:', e)
			}
		}

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: SellingDeleteOneRequest) {
		const selling = await this.sellingRepository.findOne({ id: query.id })
		if (!selling) {
			throw new BadRequestException(ERROR_MSG.SELLING.NOT_FOUND.UZ)
		}

		const wasAccepted = selling.status === SellingStatusEnum.accepted
		let clientResult: Awaited<ReturnType<typeof this.clientService.findOne>> | undefined

		if (wasAccepted) {
			try {
				clientResult = await this.clientService.findOne({ id: selling.client.id })
			} catch (e) {
				console.log('bot client fetch error:', e)
			}
		}

		await this.sellingRepository.deleteOne(query)

		if (wasAccepted && clientResult) {
			try {
				const totalPrices = this.calcTotalPricesFromProducts(selling.products)
				const payment = this.buildPaymentData(selling.payment)

				const sellingInfo = {
					...selling,
					client: clientResult.data,
					title: BotSellingTitleEnum.deleted,
					totalPrices,
					payment,
				} as any

				await this.botService.sendDeletedSellingToChannel(sellingInfo).catch((e) => console.log('bot channel error:', e))

				if (payment?.paymentMethods?.length) {
					await this.botService.sendDeletedPaymentToChannel(payment, clientResult.data).catch((e) => console.log('bot payment error:', e))
				}
			} catch (e) {
				console.log('bot send error:', e)
			}
		}

		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: SellingFindManyRequest) {
		return this.excelService.sellingDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: SellingFindOneRequest) {
		return this.excelService.sellingDownloadOne(res, query)
	}
}
