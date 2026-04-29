import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	SupplierCreateOneRequest,
	SupplierDeleteOneRequest,
	SupplierFindManyRequest,
	SupplierFindOneRequest,
	SupplierGetManyRequest,
	SupplierGetOneRequest,
	SupplierUpdateOneRequest,
} from './interfaces'
import { PriceTypeEnum, Prisma } from '@prisma/client'

/** `SupplierService.calcDebtByCurrency` uchun */
const SUPPLIER_DEBT_SOURCE_SELECT = {
	arrivals: {
		where: { deletedAt: null },
		select: {
			date: true,
			products: {
				select: {
					prices: {
						where: { type: PriceTypeEnum.cost },
						select: { totalPrice: true, currencyId: true },
					},
				},
			},
			payment: {
				select: {
					paymentMethods: { select: { type: true, amount: true, currencyId: true } },
					changeMethods: { select: { type: true, amount: true, currencyId: true } },
				},
			},
		},
		orderBy: { date: 'desc' as const },
	},
	payments: {
		where: { deletedAt: null },
		select: {
			paymentMethods: { select: { type: true, amount: true, currencyId: true } },
			changeMethods: { select: { type: true, amount: true, currencyId: true } },
		},
	},
} as const

@Injectable()
export class SupplierRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	private buildSupplierSearchFilter(search?: string): Prisma.SupplierModelWhereInput {
		if (!search) return {}
		const words = search.split(/\s+/).filter(Boolean)
		const perWord = (word: string): Prisma.SupplierModelWhereInput => ({
			OR: [
				{ fullname: { contains: word, mode: Prisma.QueryMode.insensitive } },
				{ phone: { contains: word, mode: Prisma.QueryMode.insensitive } },
				{ description: { contains: word, mode: Prisma.QueryMode.insensitive } },
			],
		})
		return words.length > 1 ? { AND: words.map(perWord) } : perWord(words[0])
	}

	private supplierFindManyWhere(query: SupplierFindManyRequest): Prisma.SupplierModelWhereInput {
		let idPart: Prisma.SupplierModelWhereInput = {}
		if (query.ids?.length) {
			idPart = { id: { in: query.ids } }
		}
		return {
			...idPart,
			...this.buildSupplierSearchFilter(query.search),
		}
	}

	async findMany(query: SupplierFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const suppliers = await this.prisma.supplierModel.findMany({
			where: this.supplierFindManyWhere(query),
			select: {
				id: true,
				fullname: true,
				phone: true,
				description: true,
				createdAt: true,
				...SUPPLIER_DEBT_SOURCE_SELECT,
			},
			...paginationOptions,
		})

		return suppliers
	}

	/** Bir nechta ta'minotchi uchun joriy qarz (`SupplierService.calcDebtByCurrency`) */
	async findDebtSourcesBySupplierIds(supplierIds: string[]) {
		const unique = [...new Set(supplierIds.filter(Boolean))]
		if (unique.length === 0) return []
		return this.prisma.supplierModel.findMany({
			where: { id: { in: unique } },
			select: {
				id: true,
				...SUPPLIER_DEBT_SOURCE_SELECT,
			},
		})
	}

	async findOne(query: SupplierFindOneRequest) {
		const supplier = await this.prisma.supplierModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				fullname: true,
				phone: true,
				description: true,
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
				arrivals: {
					where: { deletedAt: null },
					select: {
						date: true,
						products: {
							orderBy: [{ createdAt: 'desc' }],
							select: {
								prices: { orderBy: [{ createdAt: 'desc' }], where: { type: 'cost' }, select: { totalPrice: true, currencyId: true, currency: true } },
							},
						},
						payment: {
							select: {
								createdAt: true,
								description: true,
								paymentMethods: { orderBy: [{ createdAt: 'desc' }], select: { amount: true, currencyId: true, type: true, currency: true } },
								changeMethods: { orderBy: [{ createdAt: 'desc' }], select: { amount: true, currencyId: true, type: true, currency: true } },
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					orderBy: [{ createdAt: 'desc' }],
					where: { deletedAt: null },
					select: {
						createdAt: true,
						description: true,
						paymentMethods: { orderBy: [{ createdAt: 'desc' }], select: { amount: true, currencyId: true, type: true, currency: true } },
						changeMethods: { orderBy: [{ createdAt: 'desc' }], select: { amount: true, currencyId: true, type: true, currency: true } },
					},
				},
			},
		})

		return supplier
	}

	async countFindMany(query: SupplierFindManyRequest) {
		const count = await this.prisma.supplierModel.count({
			where: this.supplierFindManyWhere(query),
		})

		return count
	}

	async getMany(query: SupplierGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const suppliers = await this.prisma.supplierModel.findMany({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
			},
			...paginationOptions,
		})

		return suppliers
	}

	async getOne(query: SupplierGetOneRequest) {
		const supplier = await this.prisma.supplierModel.findFirst({
			where: { id: query.id, fullname: query.fullname, phone: query.phone },
			select: { id: true, fullname: true, phone: true, createdAt: true, deletedAt: true },
		})

		return supplier
	}

	async countGetMany(query: SupplierGetManyRequest) {
		const count = await this.prisma.supplierModel.count({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
			},
		})

		return count
	}

	async createOne(body: SupplierCreateOneRequest) {
		const supplier = await this.prisma.supplierModel.create({
			data: {
				fullname: body.fullname,
				phone: body.phone,
				description: body.description,
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				description: true,
				createdAt: true,
			},
		})
		return supplier
	}

	async updateOne(query: SupplierGetOneRequest, body: SupplierUpdateOneRequest) {
		const supplier = await this.prisma.supplierModel.update({
			where: { id: query.id },
			data: {
				fullname: body.fullname,
				phone: body.phone,
				description: body.description,
				deletedAt: body.deletedAt,
			},
		})

		return supplier
	}

	async deleteOne(query: SupplierDeleteOneRequest) {
		const supplier = await this.prisma.supplierModel.delete({
			where: { id: query.id },
		})

		return supplier
	}
}
