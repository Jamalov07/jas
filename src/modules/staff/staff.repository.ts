import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import {
	StaffCreateOneRequest,
	StaffDeleteOneRequest,
	StaffFindManyRequest,
	StaffFindOneRequest,
	StaffGetManyRequest,
	StaffGetOneRequest,
	StaffUpdateOneRequest,
} from './interfaces'
import { PageEnum } from '@prisma/client'

@Injectable()
export class StaffRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: StaffFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const staffs = await this.prisma.staffModel.findMany({
			where: {
				fullname: query.fullname,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				pages: true,
				fullname: true,
				phone: true,
				actions: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
			...paginationOptions,
		})

		return staffs
	}

	async findOne(query: StaffFindOneRequest) {
		const staff = await this.prisma.staffModel.findFirst({
			where: { id: query.id },
			select: {
				id: true,
				fullname: true,
				pages: true,
				phone: true,
				actions: true,
				updatedAt: true,
				createdAt: true,
				deletedAt: true,
			},
		})

		return staff
	}

	async countFindMany(query: StaffFindManyRequest) {
		const staffsCount = await this.prisma.staffModel.count({
			where: {
				fullname: query.fullname,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
		})

		return staffsCount
	}

	async getMany(query: StaffGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const staffs = await this.prisma.staffModel.findMany({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
			},
			...paginationOptions,
		})

		return staffs
	}

	async getOne(query: StaffGetOneRequest) {
		const staff = await this.prisma.staffModel.findFirst({
			where: { id: query.id, fullname: query.fullname, phone: query.phone },
			select: { id: true, fullname: true, phone: true, currency: true, createdAt: true, deletedAt: true, password: true, token: true, pages: true },
		})

		return staff
	}

	async countGetMany(query: StaffGetManyRequest) {
		const staffsCount = await this.prisma.staffModel.count({
			where: {
				id: { in: query.ids },
				fullname: query.fullname,
			},
		})

		return staffsCount
	}

	async createOne(body: StaffCreateOneRequest) {
		const staff = await this.prisma.staffModel.create({
			data: {
				fullname: body.fullname,
				password: body.password,
				phone: body.phone,
				actions: { connect: body.actionsToConnect.map((r) => ({ id: r })) },
				pages: body.pagesToConnect,
			},
			select: {
				id: true,
				createdAt: true,
				fullname: true,
				phone: true,
				actions: { select: { id: true, description: true, method: true, url: true, name: true, permission: true } },
			},
		})
		return staff
	}

	async updateOne(query: StaffGetOneRequest, body: StaffUpdateOneRequest) {
		const s = await this.getOne(query)

		const pagesToConnect = body.pagesToConnect ? (Array.isArray(body.pagesToConnect) ? body.pagesToConnect : []) : []

		const pagesToDisconnect = body.pagesToDisconnect ? (Array.isArray(body.pagesToDisconnect) ? body.pagesToDisconnect : []) : []

		let pagesToSet: PageEnum[] = Array.isArray(s.pages) ? [...s.pages] : []

		for (const page of pagesToConnect) {
			if (!pagesToSet.includes(page)) {
				pagesToSet.push(page)
			}
		}

		if (pagesToDisconnect.length) {
			pagesToSet = pagesToSet.filter((page) => !pagesToDisconnect.includes(page))
		}

		const staff = await this.prisma.staffModel.update({
			where: { id: query.id },
			data: {
				fullname: body.fullname,
				password: body.password,
				phone: body.phone,
				token: body.token,
				currencyId: body.currencyId,
				deletedAt: body.deletedAt,
				actions: {
					connect: (body.actionsToConnect ?? []).map((r) => ({ id: r })),
					disconnect: (body.actionsToDisconnect ?? []).map((r) => ({ id: r })),
				},
				pages: pagesToSet,
			},
		})

		return staff
	}

	async deleteOne(query: StaffDeleteOneRequest) {
		const staff = await this.prisma.staffModel.delete({
			where: { id: query.id },
		})

		return staff
	}

	async updateCurrency(staffId: string, currencyId: string) {
		await this.prisma.staffModel.update({
			where: { id: staffId },
			data: { currencyId },
		})
	}

}
