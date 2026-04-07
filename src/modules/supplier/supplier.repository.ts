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
@Injectable()
export class SupplierRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: SupplierFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const suppliers = await this.prisma.supplierModel.findMany({
			where: {
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				createdAt: true,
				arrivals: {
					select: {
						date: true,
						products: {
							select: {
								prices: {
									where: { type: 'cost' },
									select: { totalPrice: true, currencyId: true },
								},
							},
						},
						payment: {
							select: {
								methods: {
									select: { type: true, amount: true, currencyId: true },
								},
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					where: { deletedAt: null },
					select: {
						methods: {
							select: { type: true, amount: true, currencyId: true },
						},
					},
				},
			},
			...paginationOptions,
		})

		return suppliers
	}

	async findOne(query: SupplierFindOneRequest) {
		const supplier = await this.prisma.supplierModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				fullname: true,
				phone: true,
				createdAt: true,
				updatedAt: true,
				deletedAt: true,
				arrivals: {
					select: {
						date: true,
						products: {
							select: {
								prices: {
									where: { type: 'cost' },
									select: { totalPrice: true, currencyId: true },
								},
							},
						},
						payment: {
							select: {
								createdAt: true,
								description: true,
								methods: {
									select: { amount: true, currencyId: true, type: true },
								},
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					where: { deletedAt: null },
					select: {
						createdAt: true,
						description: true,
						methods: {
							select: { amount: true, currencyId: true, type: true },
						},
					},
				},
			},
		})

		return supplier
	}

	async countFindMany(query: SupplierFindManyRequest) {
		const count = await this.prisma.supplierModel.count({
			where: {
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
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
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
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
