import { BadRequestException, Injectable } from '@nestjs/common'
import { ClientRepository } from './client.repository'
import { createResponse, DebtTypeEnum, DeleteMethodEnum, ERROR_MSG } from '@common'
import {
	ClientGetOneRequest,
	ClientCreateOneRequest,
	ClientUpdateOneRequest,
	ClientGetManyRequest,
	ClientFindManyRequest,
	ClientFindOneRequest,
	ClientDeleteOneRequest,
	ClientDebtByCurrency,
	ClientDeed,
} from './interfaces'
import { PaymentMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const isExcludedFromDebt = (type: string) => type === PaymentMethodEnum.fromBalance
import { ExcelService } from '../shared'
import { Response } from 'express'

@Injectable()
export class ClientService {
	private readonly clientRepository: ClientRepository

	constructor(
		clientRepository: ClientRepository,
		private readonly excelService: ExcelService,
	) {
		this.clientRepository = clientRepository
	}

	private calcDebtByCurrency(
		sellings: Array<{
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: { methods: Array<{ type: string; amount: Decimal; currencyId: string }> } | null
		}>,
		payments: Array<{ methods: Array<{ type: string; amount: Decimal; currencyId: string }> }>,
		returnings: Array<{
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: { methods: Array<{ type: string; amount: Decimal; currencyId: string }> } | null
		}>,
	): Map<string, Decimal> {
		const debtMap = new Map<string, Decimal>()

		for (const sel of sellings) {
			for (const product of sel.products) {
				for (const price of product.prices) {
					const curr = debtMap.get(price.currencyId) ?? new Decimal(0)
					debtMap.set(price.currencyId, curr.plus(price.totalPrice))
				}
			}
			if (sel.payment) {
				for (const method of sel.payment.methods) {
					const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
					if (method.type === PaymentMethodEnum.fromCash || method.type === PaymentMethodEnum.fromBalance) {
						// Change returned or credited to balance — reduces effective payment, increases debt
						debtMap.set(method.currencyId, curr.plus(method.amount))
					} else {
						debtMap.set(method.currencyId, curr.minus(method.amount))
					}
				}
			}
		}

		for (const ret of returnings) {
			// Returning product reduces client debt (client returned goods)
			for (const product of ret.products) {
				for (const price of product.prices) {
					const curr = debtMap.get(price.currencyId) ?? new Decimal(0)
					debtMap.set(price.currencyId, curr.minus(price.totalPrice))
				}
			}
			// All returning payment methods reverse the credit (business settled with client)
			if (ret.payment) {
				for (const method of ret.payment.methods) {
					const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
					debtMap.set(method.currencyId, curr.plus(method.amount))
				}
			}
		}

		for (const payment of payments) {
			for (const method of payment.methods) {
				if (isExcludedFromDebt(method.type)) continue
				const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
				if (method.type === PaymentMethodEnum.fromCash) {
					debtMap.set(method.currencyId, curr.plus(method.amount))
				} else {
					debtMap.set(method.currencyId, curr.minus(method.amount))
				}
			}
		}

		return debtMap
	}

	async findMany(query: ClientFindManyRequest) {
		const clients = await this.clientRepository.findMany({ ...query, pagination: false })

		const mappedClients = clients.map((c) => {
			const debtMap = this.calcDebtByCurrency(c.sellings, c.payments, c.returnings)
			const debtByCurrency: ClientDebtByCurrency[] = Array.from(debtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
			const totalDebt = Array.from(debtMap.values()).reduce((a, b) => a.plus(b), new Decimal(0))

			return {
				id: c.id,
				fullname: c.fullname,
				phone: c.phone,
				telegram: c.telegram,
				createdAt: c.createdAt,
				debtByCurrency,
				_totalDebt: totalDebt,
				lastSellingDate: c.sellings?.length ? c.sellings[0].date : null,
			}
		})

		const filteredClients = mappedClients.filter((c) => {
			if (query.debtType && query.debtValue !== undefined) {
				const value = new Decimal(query.debtValue)
				switch (query.debtType) {
					case DebtTypeEnum.gt:
						return c._totalDebt.gt(value)
					case DebtTypeEnum.lt:
						return c._totalDebt.lt(value)
					case DebtTypeEnum.eq:
						return c._totalDebt.eq(value)
					default:
						return true
				}
			}
			return true
		})

		const sortedClients = filteredClients.sort((a, b) => {
			const da = a.lastSellingDate ? new Date(a.lastSellingDate).getTime() : 0
			const db = b.lastSellingDate ? new Date(b.lastSellingDate).getTime() : 0
			return db - da
		})

		const paginatedClients = query.pagination
			? sortedClients.slice((query.pageNumber - 1) * query.pageSize, query.pageNumber * query.pageSize).map(({ _totalDebt, ...rest }) => rest)
			: sortedClients.map(({ _totalDebt, ...rest }) => rest)

		const result = query.pagination
			? {
					totalCount: sortedClients.length,
					pagesCount: Math.ceil(sortedClients.length / query.pageSize),
					pageSize: paginatedClients.length,
					data: paginatedClients,
				}
			: { data: paginatedClients }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ClientFindOneRequest) {
		const deedStartDate = query.deedStartDate ? new Date(new Date(query.deedStartDate).setHours(0, 0, 0, 0)) : undefined
		const deedEndDate = query.deedEndDate ? new Date(new Date(query.deedEndDate).setHours(23, 59, 59, 999)) : undefined

		const client = await this.clientRepository.findOne(query)

		if (!client) {
			throw new BadRequestException(ERROR_MSG.CLIENT.NOT_FOUND.UZ)
		}

		const deeds: ClientDeed[] = []
		const totalDebitMap = new Map<string, Decimal>()
		const totalCreditMap = new Map<string, Decimal>()

		const addToMap = (map: Map<string, Decimal>, currencyId: string, amount: Decimal) => {
			const curr = map.get(currencyId) ?? new Decimal(0)
			map.set(currencyId, curr.plus(amount))
		}

		for (const sel of client.sellings) {
			for (const product of sel.products) {
				for (const price of product.prices) {
					if ((!deedStartDate || sel.date >= deedStartDate) && (!deedEndDate || sel.date <= deedEndDate)) {
						deeds.push({ type: 'debit', action: 'selling', value: price.totalPrice, date: sel.date, description: '', currencyId: price.currencyId })
						addToMap(totalDebitMap, price.currencyId, price.totalPrice)
					}
				}
			}

			if (sel.payment) {
				for (const method of sel.payment.methods) {
					const payDate = sel.payment.createdAt
					if (method.type === PaymentMethodEnum.fromCash || method.type === PaymentMethodEnum.fromBalance) {
						// Change returned or credited to balance — debit (increases what client owes)
						deeds.push({
							type: 'debit',
							action: 'change',
							value: method.amount,
							date: payDate,
							description: sel.payment.description ?? '',
							currencyId: method.currencyId,
						})
						addToMap(totalDebitMap, method.currencyId, method.amount)
					} else {
						if ((!deedStartDate || payDate >= deedStartDate) && (!deedEndDate || payDate <= deedEndDate)) {
							deeds.push({
								type: 'credit',
								action: 'payment',
								value: method.amount,
								date: payDate,
								description: sel.payment.description ?? '',
								currencyId: method.currencyId,
							})
							addToMap(totalCreditMap, method.currencyId, method.amount)
						}
					}
				}
			}
		}

		for (const returning of client.returnings) {
			// Returning product: credit (reduces what client owes)
			for (const product of returning.products) {
				for (const price of product.prices) {
					if ((!deedStartDate || returning.date >= deedStartDate) && (!deedEndDate || returning.date <= deedEndDate)) {
						deeds.push({
							type: 'credit',
							action: 'returning',
							value: price.totalPrice,
							date: returning.date,
							description: '',
							currencyId: price.currencyId,
						})
						addToMap(totalCreditMap, price.currencyId, price.totalPrice)
					}
				}
			}
			// Returning payment methods: debit (business settled, reverses the credit)
			if (returning.payment) {
				for (const method of returning.payment.methods) {
					const payDate = returning.payment.createdAt
					if ((!deedStartDate || payDate >= deedStartDate) && (!deedEndDate || payDate <= deedEndDate)) {
						deeds.push({
							type: 'debit',
							action: 'returning',
							value: method.amount,
							date: payDate,
							description: returning.payment.description ?? '',
							currencyId: method.currencyId,
						})
						addToMap(totalDebitMap, method.currencyId, method.amount)
					}
				}
			}
		}

		for (const payment of client.payments) {
			for (const method of payment.methods) {
				if (isExcludedFromDebt(method.type)) continue
				if ((!deedStartDate || payment.createdAt >= deedStartDate) && (!deedEndDate || payment.createdAt <= deedEndDate)) {
					deeds.push({
						type: 'credit',
						action: 'payment',
						value: method.amount,
						date: payment.createdAt,
						description: payment.description ?? '',
						currencyId: method.currencyId,
					})
					addToMap(totalCreditMap, method.currencyId, method.amount)
				}
			}
		}

		const filteredDeeds = deeds.filter((d) => !d.value.equals(0)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		const allCurrencies = new Set([...totalDebitMap.keys(), ...totalCreditMap.keys()])
		const debtByCurrencyMap = new Map<string, Decimal>()
		for (const currId of allCurrencies) {
			const debit = totalDebitMap.get(currId) ?? new Decimal(0)
			const credit = totalCreditMap.get(currId) ?? new Decimal(0)
			debtByCurrencyMap.set(currId, debit.minus(credit))
		}

		const totalCreditByCurrency = Array.from(totalCreditMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
		const totalDebitByCurrency = Array.from(totalDebitMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
		const debtByCurrency = Array.from(debtByCurrencyMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))

		const fullDebtMap = this.calcDebtByCurrency(client.sellings, client.payments, client.returnings)
		const fullDebt = Array.from(fullDebtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))

		return createResponse({
			data: {
				id: client.id,
				fullname: client.fullname,
				phone: client.phone,
				createdAt: client.createdAt,
				updatedAt: client.updatedAt,
				deletedAt: client.deletedAt,
				debtByCurrency: fullDebt,
				deedInfo: {
					totalDebitByCurrency,
					totalCreditByCurrency,
					debtByCurrency,
					deeds: filteredDeeds,
				},
				telegram: client.telegram,
				lastSellingDate: client.sellings?.length ? client.sellings[0].date : null,
			},
			success: { messages: ['find one success'] },
		})
	}

	async getMany(query: ClientGetManyRequest) {
		const clients = await this.clientRepository.getMany(query)
		const clientsCount = await this.clientRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(clientsCount / query.pageSize),
					pageSize: clients.length,
					data: clients,
				}
			: { data: clients }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ClientGetOneRequest) {
		const client = await this.clientRepository.getOne(query)

		if (!client) {
			throw new BadRequestException(ERROR_MSG.CLIENT.NOT_FOUND.UZ)
		}

		return createResponse({ data: client, success: { messages: ['get one success'] } })
	}

	async createOne(body: ClientCreateOneRequest) {
		const candidate = await this.clientRepository.getOne({ phone: body.phone })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.CLIENT.PHONE_EXISTS.UZ)
		}

		const client = await this.clientRepository.createOne({ ...body })

		return createResponse({ data: client, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ClientGetOneRequest, body: ClientUpdateOneRequest) {
		await this.getOne(query)

		if (body.phone) {
			const candidate = await this.clientRepository.getOne({ phone: body.phone })
			if (candidate && candidate.id !== query.id) {
				throw new BadRequestException(ERROR_MSG.CLIENT.PHONE_EXISTS.UZ)
			}
		}

		await this.clientRepository.updateOne(query, { ...body })

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ClientDeleteOneRequest) {
		await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.clientRepository.deleteOne(query)
		} else {
			await this.clientRepository.updateOne(query, { deletedAt: new Date() })
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async findManyForReport(query: ClientFindManyRequest) {
		return this.findMany(query)
	}

	async excelDownloadMany(res: Response, query: ClientFindManyRequest) {
		return await this.excelService.clientDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: ClientFindOneRequest) {
		return await this.excelService.clientDeedDownloadOne(res, query)
	}

	async excelWithProductDownloadOne(res: Response, query: ClientFindOneRequest) {
		return await this.excelService.clientDeedWithProductDownloadOne(res, query)
	}
}
