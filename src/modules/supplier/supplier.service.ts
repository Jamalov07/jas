import { BadRequestException, Injectable } from '@nestjs/common'
import { SupplierRepository } from './supplier.repository'
import {
	createResponse,
	currencyBriefMapFromRows,
	DebtTypeEnum,
	DeleteMethodEnum,
	ERROR_MSG,
	netDebtCrossCurrencyRows,
	roundDebtDecimal,
	withCurrencyBriefAmountMany,
} from '@common'
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
import { ChangeMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const isChangeBalanceExcludedFromDebt = (type: string) => type === ChangeMethodEnum.balance
import { ExcelService } from '../shared'
import { Response } from 'express'
import { CurrencyRepository } from '../currency'

@Injectable()
export class SupplierService {
	private readonly supplierRepository: SupplierRepository

	constructor(
		supplierRepository: SupplierRepository,
		private readonly currencyRepository: CurrencyRepository,
		private readonly excelService: ExcelService,
	) {
		this.supplierRepository = supplierRepository
	}

	private calcDebtByCurrency(
		arrivals: Array<{
			products: Array<{ prices: Array<{ totalPrice: Decimal; currencyId: string }> }>
			payment?: {
				paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
				changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
			} | null
		}>,
		payments: Array<{
			paymentMethods: Array<{ type: string; amount: Decimal; currencyId: string }>
			changeMethods?: Array<{ type: string; amount: Decimal; currencyId: string }> | null
		}>,
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
				for (const method of arr.payment.paymentMethods) {
					const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
					debtMap.set(method.currencyId, curr.minus(method.amount))
				}
				for (const ch of arr.payment.changeMethods ?? []) {
					if (isChangeBalanceExcludedFromDebt(ch.type)) continue
					const curr = debtMap.get(ch.currencyId) ?? new Decimal(0)
					debtMap.set(ch.currencyId, curr.plus(ch.amount))
				}
			}
		}

		for (const payment of payments) {
			for (const method of payment.paymentMethods) {
				const curr = debtMap.get(method.currencyId) ?? new Decimal(0)
				debtMap.set(method.currencyId, curr.minus(method.amount))
			}
			for (const ch of payment.changeMethods ?? []) {
				if (isChangeBalanceExcludedFromDebt(ch.type)) continue
				const curr = debtMap.get(ch.currencyId) ?? new Decimal(0)
				if (ch.type === ChangeMethodEnum.cash) {
					debtMap.set(ch.currencyId, curr.plus(ch.amount))
				} else {
					debtMap.set(ch.currencyId, curr.minus(ch.amount))
				}
			}
		}

		return debtMap
	}

	/** Bir yoki bir nechta ta'minotchi uchun joriy qarz (`findMany` bilan bir xil), valyuta obyekti bilan */
	async getDebtSnapshotsBySupplierIds(supplierIds: string[]): Promise<Map<string, SupplierDebtByCurrency[]>> {
		const rows = await this.supplierRepository.findDebtSourcesBySupplierIds(supplierIds)
		const allCurrencyIds = new Set<string>()
		const rawBySupplier = new Map<string, { currencyId: string; amount: Decimal }[]>()
		for (const row of rows) {
			const debtMap = this.calcDebtByCurrency(row.arrivals, row.payments)
			for (const id of debtMap.keys()) allCurrencyIds.add(id)
			rawBySupplier.set(
				row.id,
				Array.from(debtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount })),
			)
		}
		const { rates, symbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...allCurrencyIds])
		for (const [id, arr] of rawBySupplier.entries()) {
			rawBySupplier.set(id, netDebtCrossCurrencyRows(arr, rates, symbols))
		}
		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...allCurrencyIds]))
		const out = new Map<string, SupplierDebtByCurrency[]>()
		for (const row of rows) {
			const arr = rawBySupplier.get(row.id) ?? []
			out.set(row.id, withCurrencyBriefAmountMany(arr, currencyMap))
		}
		return out
	}

	async findMany(query: SupplierFindManyRequest) {
		const suppliers = await this.supplierRepository.findMany({ ...query, pagination: false })

		const currencyIdSet = new Set<string>()
		const mappedSuppliersPre = suppliers.map((s) => {
			const debtMap = this.calcDebtByCurrency(s.arrivals, s.payments)
			for (const id of debtMap.keys()) currencyIdSet.add(id)
			const debtByCurrency: Array<{ currencyId: string; amount: Decimal }> = Array.from(debtMap.entries()).map(([currencyId, amount]) => ({
				currencyId,
				amount,
			}))

			return {
				id: s.id,
				fullname: s.fullname,
				phone: s.phone,
				description: s.description,
				createdAt: s.createdAt,
				debtByCurrency,
				lastArrivalDate: s.arrivals?.length ? s.arrivals[0].date : null,
			}
		})

		const supDebtIds = new Set<string>()
		for (const m of mappedSuppliersPre) {
			for (const d of m.debtByCurrency) supDebtIds.add(d.currencyId)
		}
		const { rates: supRates, symbols: supSymbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...supDebtIds])

		const mappedSuppliers = mappedSuppliersPre.map((s) => {
			const debtByCurrency = netDebtCrossCurrencyRows(s.debtByCurrency, supRates, supSymbols)
			const totalDebt = debtByCurrency.reduce((a, b) => a.plus(b.amount), new Decimal(0))
			return { ...s, debtByCurrency, _totalDebt: totalDebt }
		})

		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...currencyIdSet]))
		const suppliersWithDebtCurrency = mappedSuppliers.map((row) => ({
			...row,
			debtByCurrency: withCurrencyBriefAmountMany(row.debtByCurrency, currencyMap),
		}))

		const filteredSuppliers = suppliersWithDebtCurrency.filter((s) => {
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

		const buildDeedValues = (items: Array<{ amount: Decimal; currencyId: string; currency: unknown }>) => {
			const map = new Map<string, { amount: Decimal; currency: unknown }>()
			for (const item of items) {
				const existing = map.get(item.currencyId)
				if (existing) {
					map.set(item.currencyId, { amount: existing.amount.plus(item.amount), currency: existing.currency })
				} else {
					map.set(item.currencyId, { amount: item.amount, currency: item.currency })
				}
			}
			return Array.from(map.entries()).map(([currencyId, { amount, currency }]) => ({ currencyId, amount, currency })) as SupplierDeed['values']
		}

		for (const arr of supplier.arrivals) {
			const arrInPeriod = (!deedStartDate || arr.date >= deedStartDate) && (!deedEndDate || arr.date <= deedEndDate)
			if (arrInPeriod) {
				const values = buildDeedValues(arr.products.flatMap((p) => p.prices.map((pr) => ({ amount: pr.totalPrice, currencyId: pr.currencyId, currency: pr.currency }))))
				if (values.length > 0) {
					deeds.push({ type: 'debit', action: 'arrival', date: arr.date, description: arr.description ?? '', values })
					for (const v of values) addToMap(totalDebitMap, v.currencyId, v.amount)
				}
			}

			if (arr.payment) {
				const payDate = arr.payment.createdAt
				const payInPeriod = (!deedStartDate || payDate >= deedStartDate) && (!deedEndDate || payDate <= deedEndDate)
				if (payInPeriod) {
					const pmValues = buildDeedValues(arr.payment.paymentMethods.map((m) => ({ amount: m.amount, currencyId: m.currencyId, currency: m.currency })))
					if (pmValues.length > 0) {
						deeds.push({ type: 'credit', action: 'payment', date: payDate, description: arr.payment.description ?? '', values: pmValues })
						for (const v of pmValues) addToMap(totalCreditMap, v.currencyId, v.amount)
					}
					const chValues = buildDeedValues(
						(arr.payment.changeMethods ?? [])
							.filter((ch) => !isChangeBalanceExcludedFromDebt(ch.type))
							.map((ch) => ({ amount: ch.amount, currencyId: ch.currencyId, currency: ch.currency })),
					)
					if (chValues.length > 0) {
						deeds.push({ type: 'debit', action: 'change', date: payDate, description: arr.payment.description ?? '', values: chValues })
						for (const v of chValues) addToMap(totalDebitMap, v.currencyId, v.amount)
					}
				}
			}
		}

		for (const payment of supplier.payments) {
			const inPeriod = (!deedStartDate || payment.createdAt >= deedStartDate) && (!deedEndDate || payment.createdAt <= deedEndDate)
			if (inPeriod) {
				const pmValues = buildDeedValues(payment.paymentMethods.map((m) => ({ amount: m.amount, currencyId: m.currencyId, currency: m.currency })))
				if (pmValues.length > 0) {
					deeds.push({ type: 'credit', action: 'payment', date: payment.createdAt, description: payment.description ?? '', values: pmValues })
					for (const v of pmValues) addToMap(totalCreditMap, v.currencyId, v.amount)
				}
				const chValues = buildDeedValues(
					(payment.changeMethods ?? [])
						.filter((ch) => !isChangeBalanceExcludedFromDebt(ch.type))
						.map((ch) => ({ amount: ch.amount, currencyId: ch.currencyId, currency: ch.currency })),
				)
				if (chValues.length > 0) {
					deeds.push({ type: 'credit', action: 'payment', date: payment.createdAt, description: payment.description ?? '', values: chValues })
					for (const v of chValues) addToMap(totalCreditMap, v.currencyId, v.amount)
				}
			}
		}

		const filteredDeeds = deeds
			.map((d) => ({ ...d, values: d.values.filter((v) => !v.amount.equals(0)) }))
			.filter((d) => d.values.length > 0)
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		const allCurrencies = new Set([...totalDebitMap.keys(), ...totalCreditMap.keys()])
		const debtByCurrencyMap = new Map<string, Decimal>()
		for (const currId of allCurrencies) {
			const debit = totalDebitMap.get(currId) ?? new Decimal(0)
			const credit = totalCreditMap.get(currId) ?? new Decimal(0)
			debtByCurrencyMap.set(currId, debit.minus(credit))
		}

		const deedCurrencyIds = new Set<string>([...totalCreditMap.keys(), ...totalDebitMap.keys(), ...debtByCurrencyMap.keys()])
		const fullDebtMap = this.calcDebtByCurrency(supplier.arrivals, supplier.payments)
		for (const id of fullDebtMap.keys()) deedCurrencyIds.add(id)

		const currencyMap = currencyBriefMapFromRows(await this.currencyRepository.findBriefByIds([...deedCurrencyIds]))

		const deedDebtRaw = Array.from(debtByCurrencyMap.entries())
			.filter(([, amount]) => !amount.isZero())
			.map(([currencyId, amount]) => ({ currencyId, amount }))
		const fullDebtRaw = Array.from(fullDebtMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount }))
		const allNetCurrencyIds = new Set<string>()
		for (const x of fullDebtRaw) allNetCurrencyIds.add(x.currencyId)
		for (const x of deedDebtRaw) allNetCurrencyIds.add(x.currencyId)
		const { rates: supFullRates, symbols: supFullSymbols } = await this.currencyRepository.findExchangeRatesAndSymbolsByIds([...allNetCurrencyIds])
		const fullDebtNetted = netDebtCrossCurrencyRows(fullDebtRaw, supFullRates, supFullSymbols)
		const deedDebtNetted = netDebtCrossCurrencyRows(deedDebtRaw, supFullRates, supFullSymbols)

		const totalCreditByCurrency: SupplierDebtByCurrency[] = withCurrencyBriefAmountMany(
			Array.from(totalCreditMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount })),
			currencyMap,
		).map((r) => ({ ...r, amount: roundDebtDecimal(r.amount) }))
		const totalDebitByCurrency: SupplierDebtByCurrency[] = withCurrencyBriefAmountMany(
			Array.from(totalDebitMap.entries()).map(([currencyId, amount]) => ({ currencyId, amount })),
			currencyMap,
		).map((r) => ({ ...r, amount: roundDebtDecimal(r.amount) }))
		const deedDebtByCurrency: SupplierDebtByCurrency[] = withCurrencyBriefAmountMany(deedDebtNetted, currencyMap)

		const fullDebt: SupplierDebtByCurrency[] = withCurrencyBriefAmountMany(fullDebtNetted, currencyMap)

		return createResponse({
			data: {
				id: supplier.id,
				fullname: supplier.fullname,
				phone: supplier.phone,
				description: supplier.description,
				createdAt: supplier.createdAt,
				updatedAt: supplier.updatedAt,
				deletedAt: supplier.deletedAt,
				debtByCurrency: fullDebt,
				deedInfo: {
					totalDebitByCurrency,
					totalCreditByCurrency,
					debtByCurrency: deedDebtByCurrency,
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
