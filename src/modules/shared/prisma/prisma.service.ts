import type { OnModuleInit, OnModuleDestroy, Type } from '@nestjs/common'
import { Global, Injectable, RequestMethod } from '@nestjs/common'
import { Controller } from '@nestjs/common/interfaces'
import { ConfigService } from '@nestjs/config'
import { ActionMethodEnum, PrismaClient } from '@prisma/client'
import { actionDescriptionConverter } from '../../../common/helper'

@Global()
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly config: ConfigService
	constructor(config: ConfigService) {
		super({ datasources: { db: { url: config.getOrThrow<string>('database.url') } } })
		this.config = config

		this.$use(async (params, next) => {
			if (['findMany', 'findFirst'].includes(params.action) && !['ActionModel', 'BotUserModel'].includes(params.model)) {
				if (!params.args) params.args = {}
				if (!params?.args?.orderBy) {
					params.args.orderBy = [{ createdAt: 'desc' }]
				} else {
					if (!['PublicIdModel'].includes(params.model)) {
						if (Array.isArray(params.args.orderBy)) {
							params.args.orderBy.push({ createdAt: 'desc' })
						} else {
							params.args.orderBy = { createdAt: 'desc' }
						}
					}
				}
				if (!['DayCloseLog'].includes(params.model)) {
					if (!params.args.where.deletedAt) {
						params.args.where.deletedAt = null
					}
				}
			}

			return next(params)
		})
	}

	async createActionMethods(controller: Type<Controller>) {
		const controllerPrototype = controller.prototype

		const baseRoute = Reflect.getMetadata('path', controller) || ''
		const actions = Object.getOwnPropertyNames(controllerPrototype)
			.filter((method) => method !== 'constructor')
			.map((method) => {
				const route = Reflect.getMetadata('path', controllerPrototype[method])
				const methodType: ActionMethodEnum = Reflect.getMetadata('method', controllerPrototype[method])
				const fullRoute = `${baseRoute}/${route || ''}`.replace(/\/+/g, '/')
				return {
					method: RequestMethod[methodType].toLowerCase(),
					url: fullRoute,
					name: method,
					description: actionDescriptionConverter(`${fullRoute}-${method}-${RequestMethod[methodType].toLowerCase()}`),
				}
			})
			.filter((action) => action.method !== 'get')
		await this.actionModel.createMany({ data: actions, skipDuplicates: true })
	}

	async onModuleInit() {
		await this.$connect()
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
