import { Injectable, OnModuleInit } from '@nestjs/common'
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
import { ServiceTypeEnum, UserTypeEnum } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { SupplierController } from './supplier.controller'

@Injectable()
export class SupplierRepository implements OnModuleInit {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: SupplierFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const suppliers = await this.prisma.userModel.findMany({
			where: {
				type: UserTypeEnum.supplier,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				fullname: true,
				balance: true,
				phone: true,
				arrivals: {
					select: {
						date: true,
						totalCost: true,
						payment: { select: { card: true, cash: true, other: true, transfer: true, total: true } },
						products: { select: { cost: true, count: true, price: true } },
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					where: { type: ServiceTypeEnum.supplier },
					select: { card: true, cash: true, other: true, transfer: true, total: true },
				},
				actions: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
			...paginationOptions,
		})

		return suppliers
	}

	async findOne(query: SupplierFindOneRequest) {
		const supplier = await this.prisma.userModel.findFirst({
			where: { id: query.id, type: UserTypeEnum.supplier },
			select: {
				id: true,
				balance: true,
				fullname: true,
				arrivals: {
					select: {
						totalCost: true,
						date: true,
						payment: {
							select: { total: true, card: true, cash: true, other: true, transfer: true, description: true, createdAt: true },
						},
						products: { select: { cost: true, count: true, price: true } },
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					where: { type: ServiceTypeEnum.supplier, deletedAt: null },
					select: { total: true, card: true, cash: true, other: true, transfer: true, description: true, createdAt: true },
				},
				phone: true,
				actions: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return supplier
	}

	async countFindMany(query: SupplierFindManyRequest) {
		const suppliersCount = await this.prisma.userModel.count({
			where: {
				type: UserTypeEnum.supplier,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
		})

		return suppliersCount
	}

	async getMany(query: SupplierGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const suppliers = await this.prisma.userModel.findMany({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
				type: UserTypeEnum.supplier,
			},
			...paginationOptions,
		})

		return suppliers
	}

	async getOne(query: SupplierGetOneRequest) {
		const supplier = await this.prisma.userModel.findFirst({
			where: { id: query.id, fullname: query.fullname, phone: query.phone },
			select: { id: true, fullname: true, phone: true, createdAt: true, deletedAt: true, password: true, token: true },
		})

		return supplier
	}

	async countGetMany(query: SupplierGetManyRequest) {
		const suppliersCount = await this.prisma.userModel.count({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
				type: UserTypeEnum.supplier,
			},
		})

		return suppliersCount
	}

	async createOne(body: SupplierCreateOneRequest) {
		const password = await bcrypt.hash(body.phone, 7)

		const supplier = await this.prisma.userModel.create({
			data: {
				fullname: body.fullname,
				password: password,
				phone: body.phone,
				type: UserTypeEnum.supplier,
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
		const supplier = await this.prisma.userModel.update({
			where: { id: query.id },
			data: {
				fullname: body.fullname,
				phone: body.phone,
				balance: body.balance,
				deletedAt: body.deletedAt,
			},
		})

		return supplier
	}

	async deleteOne(query: SupplierDeleteOneRequest) {
		const supplier = await this.prisma.userModel.delete({
			where: { id: query.id },
		})

		return supplier
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(SupplierController)
	}
}
