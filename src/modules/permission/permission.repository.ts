import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared'
import {
	PermissionCreateOneRequest,
	PermissionDeleteOneRequest,
	PermissionFindManyRequest,
	PermissionFindOneRequest,
	PermissionGetManyRequest,
	PermissionGetOneRequest,
	PermissionUpdateOneRequest,
} from './interfaces'
import { PermissionController } from './permission.controller'

@Injectable()
export class PermissionRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: PermissionFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const permissions = await this.prisma.permissionModel.findMany({
			where: {
				name: { contains: query.name, mode: 'insensitive' },
			},
			select: { id: true, name: true, createdAt: true, actions: { select: { id: true, name: true, method: true, description: true, url: true } } },
			...paginationOptions,
		})

		return permissions
	}

	async findOne(query: PermissionFindOneRequest) {
		const permission = await this.prisma.permissionModel.findFirst({
			where: { id: query.id },
			select: { id: true, name: true, createdAt: true, actions: { select: { id: true, name: true, method: true, description: true, url: true } } },
		})

		return permission
	}

	async countFindMany(query: PermissionFindManyRequest) {
		const permissionsCount = await this.prisma.permissionModel.count({
			where: {
				name: { contains: query.name, mode: 'insensitive' },
			},
		})

		return permissionsCount
	}

	async getMany(query: PermissionGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const permissions = await this.prisma.permissionModel.findMany({
			where: { id: { in: query.ids }, name: query.name },
			...paginationOptions,
		})

		return permissions
	}

	async getOne(query: PermissionGetOneRequest) {
		const permission = await this.prisma.permissionModel.findFirst({
			where: { id: query.id, name: query.name },
		})

		return permission
	}

	async countGetMany(query: PermissionGetManyRequest) {
		const permissionsCount = await this.prisma.permissionModel.count({
			where: { id: { in: query.ids }, name: query.name },
		})

		return permissionsCount
	}

	async createOne(body: PermissionCreateOneRequest) {
		const permission = await this.prisma.permissionModel.create({
			data: { name: body.name, actions: { connect: body.actionsToConnect.map((a) => ({ id: a })) } },
		})
		return permission
	}

	async updateOne(query: PermissionGetOneRequest, body: PermissionUpdateOneRequest) {
		const permission = await this.prisma.permissionModel.update({
			where: { id: query.id },
			data: {
				name: body.name,
				actions: {
					connect: body.actionsToConnect.map((a) => ({ id: a })),
					disconnect: body.actionsToDisconnect.map((a) => ({ id: a })),
				},
			},
		})

		return permission
	}

	async deleteOne(query: PermissionDeleteOneRequest) {
		const permission = await this.prisma.permissionModel.delete({
			where: { id: query.id },
		})

		return permission
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(PermissionController)
	}
}
