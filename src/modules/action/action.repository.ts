import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared'
import { ActionFindManyRequest, ActionFindOneRequest, ActionGetManyRequest, ActionGetOneRequest, ActionUpdateOneRequest } from './interfaces'
import { ActionController } from './action.controller'

@Injectable()
export class ActionRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findMany(query: ActionFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const actions = await this.prisma.actionModel.findMany({
			where: {
				method: query.method,
				permissionId: query.permissionId,
				url: { contains: query.url, mode: 'insensitive' },
				name: { contains: query.name, mode: 'insensitive' },
				description: { contains: query.description, mode: 'insensitive' },
			},
			...paginationOptions,
			select: { id: true, method: true, url: true, description: true, permission: true, name: true },
		})

		return actions
	}

	async countFindMany(query: ActionFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const actionsCount = await this.prisma.actionModel.count({
			where: {
				permissionId: query.permissionId,
				method: query.method,
				url: { contains: query.url, mode: 'insensitive' },
				name: { contains: query.name, mode: 'insensitive' },
				description: { contains: query.description, mode: 'insensitive' },
			},
			...paginationOptions,
		})

		return actionsCount
	}

	async findOne(query: ActionFindOneRequest) {
		const action = await this.prisma.actionModel.findFirst({
			where: { id: query.id },
			select: { id: true, method: true, url: true, description: true, permission: true, name: true },
		})

		return action
	}

	async getMany(query: ActionGetManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		const actions = await this.prisma.actionModel.findMany({
			where: {
				id: { in: query.ids },
				method: query.method,
				permissionId: query.permissionId,
				url: query.url,
				name: query.name,
				description: query.description,
			},
			...paginationOptions,
		})

		return actions
	}

	async countGetMany(query: ActionGetManyRequest) {
		const actionsCount = await this.prisma.actionModel.count({
			where: {
				id: { in: query.ids },
				method: query.method,
				permissionId: query.permissionId,
				url: query.url,
				name: query.name,
				description: query.description,
			},
		})

		return actionsCount
	}

	async getOne(query: ActionGetOneRequest) {
		const action = await this.prisma.actionModel.findFirst({
			where: {
				id: query.id,
				method: query.method,
				url: query.url,
				name: query.name,
				description: query.description,
				permissionId: query.permissionId,
			},
		})

		return action
	}
	async updateOne(query: ActionGetOneRequest, body: ActionUpdateOneRequest) {
		const action = await this.prisma.actionModel.update({
			where: { id: query.id },
			data: { description: body.description, permissionId: body.permissionId },
		})

		return action
	}

	async onModuleInit() {
		await this.prisma.createActionMethods(ActionController)
	}
}
