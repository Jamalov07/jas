import { BadRequestException, Injectable } from '@nestjs/common'
import { CurrencyRepository } from './currency.repository'
import { createResponse, ERROR_MSG } from '@common'
import {
	CurrencyCreateOneRequest,
	CurrencyDeleteOneRequest,
	CurrencyFindManyRequest,
	CurrencyFindOneRequest,
	CurrencyGetManyRequest,
	CurrencyGetOneRequest,
	CurrencyUpdateOneRequest,
} from './interfaces'

@Injectable()
export class CurrencyService {
	constructor(private readonly currencyRepository: CurrencyRepository) {}

	async findMany(query: CurrencyFindManyRequest) {
		const currencies = await this.currencyRepository.findMany(query)
		const currenciesCount = await this.currencyRepository.countFindMany(query)

		const result = query.pagination
			? {
					totalCount: currenciesCount,
					pagesCount: Math.ceil(currenciesCount / query.pageSize),
					pageSize: currencies.length,
					data: currencies,
				}
			: { data: currencies }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: CurrencyFindOneRequest) {
		const currency = await this.currencyRepository.findOne(query)

		if (!currency) {
			throw new BadRequestException(ERROR_MSG.CURRENCY.NOT_FOUND.UZ)
		}

		return createResponse({ data: currency, success: { messages: ['find one success'] } })
	}

	async getMany(query: CurrencyGetManyRequest) {
		const currencies = await this.currencyRepository.getMany(query)
		const currenciesCount = await this.currencyRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(currenciesCount / query.pageSize),
					pageSize: currencies.length,
					data: currencies,
				}
			: { data: currencies }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: CurrencyGetOneRequest) {
		const currency = await this.currencyRepository.getOne(query)

		if (!currency) {
			throw new BadRequestException(ERROR_MSG.CURRENCY.NOT_FOUND.UZ)
		}

		return createResponse({ data: currency, success: { messages: ['get one success'] } })
	}

	async createOne(body: CurrencyCreateOneRequest) {
		const candidate = await this.currencyRepository.getOne({ name: body.name })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.CURRENCY.NAME_EXISTS.UZ)
		}

		await this.currencyRepository.createOne(body)

		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(query: CurrencyGetOneRequest, body: CurrencyUpdateOneRequest) {
		await this.getOne(query)

		const candidate = await this.currencyRepository.getOne({ name: body.name })
		if (candidate && candidate.id !== query.id) {
			throw new BadRequestException(ERROR_MSG.CURRENCY.NAME_EXISTS.UZ)
		}

		await this.currencyRepository.updateOne(query, body)

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: CurrencyDeleteOneRequest) {
		await this.getOne(query)

		await this.currencyRepository.deleteOne(query)

		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
