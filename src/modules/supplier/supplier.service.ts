import { BadRequestException, Injectable } from '@nestjs/common'
import { SupplierRepository } from './supplier.repository'
import { createResponse, DebtTypeEnum, DeleteMethodEnum, ERROR_MSG } from '@common'
import {
	SupplierGetOneRequest,
	SupplierCreateOneRequest,
	SupplierUpdateOneRequest,
	SupplierGetManyRequest,
	SupplierFindManyRequest,
	SupplierFindOneRequest,
	SupplierDeleteOneRequest,
	SupplierDebtByCurrency,
	SupplierDeed,
} from './interfaces'
import { PaymentMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const isExcludedFromDebt = (type: string) => type === PaymentMethodEnum.fromCash || type === PaymentMethodEnum.fromBalance
import { ExcelService } from '../shared'
import { Response } from 'express'

@Injectable()
export class SupplierService {
	private readonly supplierRepository: SupplierRepository

	constructor(
		supplierRepository: SupplierRepository,
		private readonly excelService: ExcelService,
	) {
		this.supplierRepository = supplierRepository
	}

	private calcDebtByCurrency(
		arrivals: Array<{
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: { methods: Array<{ type: string; amount: Decimal; currencyId: string }> } | null
		}>,
		payments: Array<{ methods: Array<{ type: string; amount: Decimal; currencyId: string }> }>,
	): Map<string, Decimal> {
		const debtMap = new Map<string, Decimal>()

		for (const arr of arrivals) {
			for (const product of arr.products) {
				for (const price of product.prices) {
					const curr = debtMap.get(price.currencyId) ?? new Decimal(0)
					debtMap.set(price.currencyId, curr.plus(price.totalPrice))
				}
			}
			if (arr.payment) {
				for (const method of arr.payment.methods) {
					if (isExcludedFromDebt(method.type)) continue
					const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
					debtMap.set(method.currencyId, curr.minus(method.amount))
				}
			}
		}

		for (const payment of payments) {
			for (const method of payment.methods) {
				if (isExcludedFromDebt(method.type)) continue
				const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
				debtMap.set(method.currencyId, curr.minus(method.amount))
			}
		}

		return debtMap
	}

	async findMany(query: SupplierFindManyRequest) {
		const suppliers = await this.supplierRepository.findMany({ ...query, pagination: false })

		const mappedSuppliers = suppliers.map((s) => {
			const debtMap = this.calcDebtByCurrency(s.arrivals, s.payments)
			const debtByCurrency: SupplierDebtByCurrency[] = Array.from(debtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
			const totalDebt = Array.from(debtMap.values()).reduce((a, b) => a.plus(b), new Decimal(0))

			return {
				id: s.id,
				fullname: s.fullname,
				phone: s.phone,
				createdAt: s.createdAt,
				debtByCurrency,
				_totalDebt: totalDebt,
				lastArrivalDate: s.arrivals?.length ? s.arrivals[0].date : null,
			}
		})

		const filteredSuppliers = mappedSuppliers.filter((s) => {
			if (query.debtType && query.debtValue !== undefined) {
				const value = new Decimal(query.debtValue)
				switch (query.debtType) {
					case DebtTypeEnum.gt:
						return s._totalDebt.gt(value)
					case DebtTypeEnum.lt:
						return s._totalDebt.lt(value)
					case DebtTypeEnum.eq:
						return s._totalDebt.eq(value)
					default:
						return true
				}
			}
			return true
		})

		const paginatedSuppliers = query.pagination
			? filteredSuppliers.slice((query.pageNumber - 1) * query.pageSize, query.pageNumber * query.pageSize).map(({ _totalDebt, ...rest }) => rest)
			: filteredSuppliers.map(({ _totalDebt, ...rest }) => rest)

		const result = query.pagination
			? {
					totalCount: filteredSuppliers.length,
					pagesCount: Math.ceil(filteredSuppliers.length / query.pageSize),
					pageSize: paginatedSuppliers.length,
					data: paginatedSuppliers,
				}
			: { data: paginatedSuppliers }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: SupplierFindOneRequest) {
		const deedStartDate = query.deedStartDate ? new Date(new Date(query.deedStartDate).setHours(0, 0, 0, 0)) : undefined
		const deedEndDate = query.deedEndDate ? new Date(new Date(query.deedEndDate).setHours(23, 59, 59, 999)) : undefined

		const supplier = await this.supplierRepository.findOne(query)

		if (!supplier) {
			throw new BadRequestException(ERROR_MSG.SUPPLIER.NOT_FOUND.UZ)
		}

		const deeds: SupplierDeed[] = []
		const totalDebitMap = new Map<string, Decimal>()
		const totalCreditMap = new Map<string, Decimal>()

		const addToMap = (map: Map<string, Decimal>, currencyId: string, amount: Decimal) => {
			const curr = map.get(currencyId) ?? new Decimal(0)
			map.set(currencyId, curr.plus(amount))
		}

		for (const arr of supplier.arrivals) {
			for (const product of arr.products) {
				for (const price of product.prices) {
					if ((!deedStartDate || arr.date >= deedStartDate) && (!deedEndDate || arr.date <= deedEndDate)) {
						deeds.push({ type: 'debit', action: 'arrival', value: price.totalPrice, date: arr.date, description: '', currencyId: price.currencyId })
						addToMap(totalDebitMap, price.currencyId, price.totalPrice)
					}
				}
			}

			if (arr.payment) {
				for (const method of arr.payment.methods) {
					if (isExcludedFromDebt(method.type)) continue
					const payDate = arr.payment.createdAt
					if ((!deedStartDate || payDate >= deedStartDate) && (!deedEndDate || payDate <= deedEndDate)) {
						deeds.push({
							type: 'credit',
							action: 'payment',
							value: method.amount,
							date: payDate,
							description: arr.payment.description ?? '',
							currencyId: method.currencyId,
						})
						addToMap(totalCreditMap, method.currencyId, method.amount)
					}
				}
			}
		}

		for (const payment of supplier.payments) {
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

		const fullDebtMap = this.calcDebtByCurrency(supplier.arrivals, supplier.payments)
		const fullDebt = Array.from(fullDebtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))

		return createResponse({
			data: {
				id: supplier.id,
				fullname: supplier.fullname,
				phone: supplier.phone,
				createdAt: supplier.createdAt,
				updatedAt: supplier.updatedAt,
				deletedAt: supplier.deletedAt,
				debtByCurrency: fullDebt,
				deedInfo: {
					totalDebitByCurrency,
					totalCreditByCurrency,
					debtByCurrency,
					deeds: filteredDeeds,
				},
				lastArrivalDate: supplier.arrivals?.length ? supplier.arrivals[0].date : null,
			},
			success: { messages: ['find one success'] },
		})
	}

	async getMany(query: SupplierGetManyRequest) {
		const suppliers = await this.supplierRepository.getMany(query)
		const suppliersCount = await this.supplierRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(suppliersCount / query.pageSize),
					pageSize: suppliers.length,
					data: suppliers,
				}
			: { data: suppliers }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: SupplierGetOneRequest) {
		const supplier = await this.supplierRepository.getOne(query)

		if (!supplier) {
			throw new BadRequestException(ERROR_MSG.SUPPLIER.NOT_FOUND.UZ)
		}

		return createResponse({ data: supplier, success: { messages: ['get one success'] } })
	}

	async createOne(body: SupplierCreateOneRequest) {
		const candidate = await this.supplierRepository.getOne({ phone: body.phone })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.SUPPLIER.PHONE_EXISTS.UZ)
		}

		const supplier = await this.supplierRepository.createOne({ ...body })

		return createResponse({ data: supplier, success: { messages: ['create one success'] } })
	}

	async updateOne(query: SupplierGetOneRequest, body: SupplierUpdateOneRequest) {
		await this.getOne(query)

		if (body.phone) {
			const candidate = await this.supplierRepository.getOne({ phone: body.phone })
			if (candidate && candidate.id !== query.id) {
				throw new BadRequestException(ERROR_MSG.SUPPLIER.PHONE_EXISTS.UZ)
			}
		}

		await this.supplierRepository.updateOne(query, { ...body })

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: SupplierDeleteOneRequest) {
		await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.supplierRepository.deleteOne(query)
		} else {
			await this.supplierRepository.updateOne(query, { deletedAt: new Date() })
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: SupplierFindManyRequest) {
		return this.excelService.supplierDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: SupplierFindOneRequest) {
		return this.excelService.supplierDeedDownloadOne(res, query)
	}

	async excelWithProductDownloadOne(res: Response, query: SupplierFindOneRequest) {
		return this.excelService.supplierDeedWithProductDownloadOne(res, query)
	}
}
