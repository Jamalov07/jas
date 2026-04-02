import { Decimal } from '@prisma/client/runtime/library'
import { BadRequestException, Injectable } from '@nestjs/common'
import { ReturningRepository } from './returning.repository'
import { createResponse, CRequest, DeleteMethodEnum, ERROR_MSG } from '@common'
import {
	ReturningGetOneRequest,
	ReturningCreateOneRequest,
	ReturningUpdateOneRequest,
	ReturningGetManyRequest,
	ReturningFindManyRequest,
	ReturningFindOneRequest,
	ReturningDeleteOneRequest,
} from './interfaces'
import { ClientService } from '../client'
import { ProductService } from '../product'
import { SellingStatusEnum } from '@prisma/client'
import { ExcelService } from '../shared'
import { Response } from 'express'
import { CommonService } from '../common'

@Injectable()
export class ReturningService {
	constructor(
		private readonly returningRepository: ReturningRepository,
		private readonly clientService: ClientService,
		private readonly productService: ProductService,
		private readonly commonService: CommonService,
		private readonly excelService: ExcelService,
	) {}

	async findMany(query: ReturningFindManyRequest) {
		const returnings = await this.returningRepository.findMany(query)
		const returningsCount = await this.returningRepository.countFindMany(query)

		const mappedReturnings = returnings.map((returning) => {
			return {
				...returning,
				payment: returning.payment.total.toNumber() ? returning.payment : null,
				debt: returning.totalPrice.minus(returning.payment.total),
				totalPayment: returning.payment.total,
				totalPrice: returning.totalPrice,
			}
		})

		const result = query.pagination
			? {
					totalCount: returningsCount,
					pagesCount: Math.ceil(returningsCount / query.pageSize),
					pageSize: mappedReturnings.length,
					data: mappedReturnings,
				}
			: { data: mappedReturnings }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async excelDownloadMany(res: Response, query: ReturningFindManyRequest) {
		return this.excelService.returningDownloadMany(res, query)
	}

	async findOne(query: ReturningFindOneRequest) {
		const returning = await this.returningRepository.findOne(query)

		if (!returning) {
			throw new BadRequestException(ERROR_MSG.RETURNING.NOT_FOUND.UZ)
		}

		return createResponse({ data: { ...returning }, success: { messages: ['find one success'] } })
	}

	async excelDownloadOne(res: Response, query: ReturningFindOneRequest) {
		return this.excelService.returningDownloadOne(res, query)
	}

	async getMany(query: ReturningGetManyRequest) {
		const returnings = await this.returningRepository.getMany(query)
		const returningsCount = await this.returningRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(returningsCount / query.pageSize),
					pageSize: returnings.length,
					data: returnings,
				}
			: { data: returnings }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: ReturningGetOneRequest) {
		const returning = await this.returningRepository.getOne(query)

		if (!returning) {
			throw new BadRequestException(ERROR_MSG.RETURNING.NOT_FOUND.UZ)
		}

		return createResponse({ data: returning, success: { messages: ['get one success'] } })
	}

	async createOne(request: CRequest, body: ReturningCreateOneRequest) {
		await this.clientService.findOne({ id: body.clientId })

		let total = new Decimal(0)
		if (body.payment) {
			if (Object.values(body.payment).some((value) => value !== 0)) {
				body.status = SellingStatusEnum.accepted
				if (body.date) {
					const inputDate = new Date(body.date)
					const now = new Date()

					const isToday = inputDate.getFullYear() === now.getFullYear() && inputDate.getMonth() === now.getMonth() && inputDate.getDate() === now.getDate()

					if (isToday) {
						body.date = now
					} else {
						body.date = new Date(inputDate.setHours(0, 0, 0, 0))
					}
				} else {
					body.date = new Date()
				}

				total = new Decimal(body.payment?.cash ?? 0).plus(body.payment?.fromBalance ?? 0)
			}
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

		let totalPrice = new Decimal(0)

		body = {
			...body,
			staffId: request.user.id,
			payment: { ...body.payment, total: total },
			products: body.products.map((product) => {
				const totalProductPrice = new Decimal(product.price).mul(product.count)
				totalPrice = totalPrice.plus(totalProductPrice)
				return { ...product, totalPrice: totalProductPrice }
			}),
		}

		const returning = await this.returningRepository.createOne({ ...body, totalPrice: totalPrice })

		return createResponse({ data: returning, success: { messages: ['create one success'] } })
	}

	async updateOne(query: ReturningGetOneRequest, body: ReturningUpdateOneRequest) {
		const returning = await this.getOne(query)

		if (returning.data.status === SellingStatusEnum.accepted) {
			body.productIdsToRemove = []
			body.products = []
		}

		const hasValidPayment = body.payment && ['fromBalance', 'cash'].some((key) => !!body.payment?.[key] && +body.payment[key] !== 0)

		if (body.status !== SellingStatusEnum.accepted) {
			if (body.payment) {
				if (Object.values(body.payment).some((value) => value !== 0)) {
					body.status = SellingStatusEnum.accepted
					body.date = new Date()
					body.payment.total = new Decimal(body.payment.cash || 0).plus(body.payment.fromBalance || 0)
				}
			}
		}
		if (body.status === SellingStatusEnum.accepted) {
			body.date = new Date()
		}

		body = {
			...body,
			staffId: returning.data.staffId,
			payment: hasValidPayment ? body.payment : returning.data.payment,
		}
		await this.returningRepository.updateOne(query, body)

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: ReturningDeleteOneRequest) {
		await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.returningRepository.deleteOne(query)
		} else {
			// await this.returningRepository.updateOne(query, { deletedAt: new Date() })
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
