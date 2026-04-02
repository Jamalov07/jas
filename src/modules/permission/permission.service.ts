import { BadRequestException, Injectable } from '@nestjs/common'
import { PermissionRepository } from './permission.repository'
import { createResponse, DeleteMethodEnum, ERROR_MSG } from '@common'
import {
	PermissionGetOneRequest,
	PermissionCreateOneRequest,
	PermissionUpdateOneRequest,
	PermissionGetManyRequest,
	PermissionFindManyRequest,
	PermissionFindOneRequest,
	PermissionDeleteOneRequest,
} from './interfaces'

@Injectable()
export class PermissionService {
	private readonly permissionRepository: PermissionRepository

	constructor(permissionRepository: PermissionRepository) {
		this.permissionRepository = permissionRepository
	}

	async findMany(query: PermissionFindManyRequest) {
		const permissions = await this.permissionRepository.findMany(query)
		const permissionsCount = await this.permissionRepository.countFindMany(query)

		const result = query.pagination
			? {
					totalCount: permissionsCount,
					pagesCount: Math.ceil(permissionsCount / query.pageSize),
					pageSize: permissions.length,
					data: permissions,
				}
			: { data: permissions }

		return createResponse({ data: result, success: { messages: ['find many success'] } })
	}

	async findOne(query: PermissionFindOneRequest) {
		const permission = await this.permissionRepository.findOne(query)

		if (!permission) {
			throw new BadRequestException(ERROR_MSG.PERMISSION.NOT_FOUND.UZ)
		}

		return createResponse({ data: permission, success: { messages: ['find one success'] } })
	}

	async getMany(query: PermissionGetManyRequest) {
		const permissions = await this.permissionRepository.getMany(query)
		const permissionsCount = await this.permissionRepository.countGetMany(query)

		const result = query.pagination
			? {
					pagesCount: Math.ceil(permissionsCount / query.pageSize),
					pageSize: permissions.length,
					data: permissions,
				}
			: { data: permissions }

		return createResponse({ data: result, success: { messages: ['get many success'] } })
	}

	async getOne(query: PermissionGetOneRequest) {
		const permission = await this.permissionRepository.getOne(query)

		if (!permission) {
			throw new BadRequestException(ERROR_MSG.PERMISSION.NOT_FOUND.UZ)
		}

		return createResponse({ data: permission, success: { messages: ['get one success'] } })
	}

	async createOne(body: PermissionCreateOneRequest) {
		const candidate = await this.permissionRepository.getOne({ name: body.name })
		if (candidate) {
			throw new BadRequestException(ERROR_MSG.PERMISSION.NAME_EXISTS.UZ)
		}

		await this.permissionRepository.createOne({ ...body })

		return createResponse({ data: null, success: { messages: ['create one success'] } })
	}

	async updateOne(query: PermissionGetOneRequest, body: PermissionUpdateOneRequest) {
		await this.getOne(query)

		const candidate = await this.permissionRepository.getOne({ name: body.name })
		if (candidate && candidate.id !== query.id) {
			throw new BadRequestException(ERROR_MSG.PERMISSION.NAME_EXISTS.UZ)
		}

		await this.permissionRepository.updateOne(query, { ...body })

		return createResponse({ data: null, success: { messages: ['update one success'] } })
	}

	async deleteOne(query: PermissionDeleteOneRequest) {
		await this.getOne(query)
		if (query.method === DeleteMethodEnum.hard) {
			await this.permissionRepository.deleteOne(query)
		} else {
			await this.permissionRepository.updateOne(query, { deletedAt: new Date() })
		}
		return createResponse({ data: null, success: { messages: ['delete one success'] } })
	}
}
