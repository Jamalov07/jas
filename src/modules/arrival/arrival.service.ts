import { BadRequestException, Injectable } from '@nestjs/common'
import { ArrivalRepository } from './arrival.repository'
import { createResponse, CRequest, ERROR_MSG } from '@common'
import {
	ArrivalGetOneRequest,
	ArrivalCreateOneRequest,
	ArrivalUpdateOneRequest,
	ArrivalGetManyRequest,
	ArrivalFindManyRequest,
	ArrivalFindOneRequest,
	ArrivalDeleteOneRequest,
} from './interfaces'
import { Decimal } from '@prisma/client/runtime/library'
import { PaymentMethodEnum } from '@prisma/client'
import { ExcelService } from '../shared'
import { Response } from 'express'

@Injectable()
export class ArrivalService {
	constructor(
		private readonly arrivalRepository: ArrivalRepository,
		private readonly excelService: ExcelService,
	) {}

	async findMany(query: ArrivalFindManyRequest) {
		const arrivals = await this.arrivalRepository.findMany(query)
		const arrivalsCount = await this.arrivalRepository.countFindMany(query)

		const calcMap = new Map<string, Decimal>()
		const mappedArrivals = arrivals.map((arrival) => {
			for (const method of arrival.supplierArrivalPayment?.supplierArrivalPaymentMethods ?? []) {
				const key = `${method.type}_${method.currencyId}`
				calcMap.set(key, (calcMap.get(key) ?? new Decimal(0)).plus(method.amount))
			}
			const sap = arrival.supplierArrivalPayment
			const payment = sap ? { id: sap.id, description: sap.description, createdAt: sap.createdAt, paymentMethods: sap.supplierArrivalPaymentMethods } : undefined
			return { ...arrival, payment }
		})

		const calc = Array.from(calcMap.entries()).map(([key, total]) => {
			const [type, currencyId] = key.split('_')
			return { type: type as PaymentMethodEnum, currencyId, total }
		})

		const result = query.pagination
			? { totalCount: arrivalsCount, pagesCount: Math.ceil(arrivalsCount / query.pageSize), pageSize: mappedArrivals.length, data: mappedArrivals, calc }
			: { data: mappedArrivals, calc }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: ArrivalFindOneRequest) {
		const arrival = await this.arrivalRepository.findOne(query)

		if (!arrival) {
			throw new BadRequestException(ERROR_MSG.ARRIVAL.NOT_FOUND.UZ)
		}

		const sap = arrival.supplierArrivalPayment
		const payment = sap ? { id: sap.id, description: sap.description, createdAt: sap.createdAt, paymentMethods: sap.supplierArrivalPaymentMethods } : undefined
		return createResponse({ data: { ...arrival, payment }, success: { messages: ['find one success'] } })
	}

	async getMany(query: ArrivalGetManyRequest) {
		const arrivals = await this.arrivalRepository.getMany(query)
		const arrivalsCount = await this.arrivalRepository.countGetMany(query)

		const result = query.pagination ? { pagesCount: Math.ceil(arrivalsCount / query.pageSize), pageSize: arrivals.length, data: arrivals } : { data: arrivals }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ArrivalGetOneRequest) {
		const arrival = await this.arrivalRepository.getOne(query)

		if (!arrival) {
			throw new BadRequestException(ERROR_MSG.ARRIVAL.NOT_FOUND.UZ)
		}

		return createResponse({ data: arrival, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: ArrivalCreateOneRequest) {
		body.staffId = request.user.id
		const arrival = await this.arrivalRepository.createOne(body)
		return createResponse({ data: arrival, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ArrivalGetOneRequest, body: ArrivalUpdateOneRequest) {
		await this.getOne(query)
		await this.arrivalRepository.updateOne(query, body)
		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ArrivalDeleteOneRequest) {
		await this.getOne(query)
		await this.arrivalRepository.deleteOne(query)
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}

	async excelDownloadMany(res: Response, query: ArrivalFindManyRequest) {
		return this.excelService.arrivalDownloadMany(res, query)
	}

	async excelDownloadOne(res: Response, query: ArrivalFindOneRequest) {
		return this.excelService.arrivalDownloadOne(res, query)
	}
}
