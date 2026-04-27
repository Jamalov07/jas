import type { OnModuleInit, OnModuleDestroy, Type } from '@nestjs/common'
import { Global, Injectable, RequestMethod } from '@nestjs/common'
import { Controller } from '@nestjs/common/interfaces'
import { ConfigService } from '@nestjs/config'
import { ActionMethodEnum, PrismaClient } from '@prisma/client'
import { actionDescriptionConverter } from '../../../common/helper'

const MODELS_WITHOUT_CREATED_AT = ['ActionModel', 'BotUserModel', 'ProductPriceModel', 'SellingProductMVPriceModel', 'ArrivalProductMVPriceModel', 'ReturningProductMVPriceModel']

/** Nest `RequestMethod` nomi (kichik) → Prisma `ActionMethodEnum` (faqat DBda borlar) */
const NEST_VERB_TO_ACTION: Record<string, ActionMethodEnum> = {
	get: ActionMethodEnum.get,
	post: ActionMethodEnum.post,
	put: ActionMethodEnum.put,
	patch: ActionMethodEnum.patch,
	delete: ActionMethodEnum.delete,
}

const MODELS_WITHOUT_DELETED_AT = [
	'ActionModel',
	'BotUserModel',
	'ProductPriceModel',
	'SellingProductMVPriceModel',
	'ArrivalProductMVPriceModel',
	'ReturningProductMVPriceModel',
	'DayCloseLog',
]

@Global()
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly config: ConfigService
	constructor(config: ConfigService) {
		super({ datasources: { db: { url: config.getOrThrow<string>('database.url') } } })
		this.config = config

		this.$use(async (params, next) => {
			if (['findMany', 'findFirst'].includes(params.action) && !MODELS_WITHOUT_CREATED_AT.includes(params.model)) {
				if (!params.args) params.args = {}
				if (!params?.args?.orderBy) {
					params.args.orderBy = [{ createdAt: 'desc' }]
				} else {
					if (Array.isArray(params.args.orderBy)) {
						params.args.orderBy.push({ createdAt: 'desc' })
					} else {
						params.args.orderBy = { createdAt: 'desc' }
					}
				}

				if (!MODELS_WITHOUT_DELETED_AT.includes(params.model)) {
					if (!params.args.where) params.args.where = {}
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
				const handler = controllerPrototype[method as keyof typeof controllerPrototype] as object
				const route = Reflect.getMetadata('path', handler)
				const methodType = Reflect.getMetadata('method', handler) as RequestMethod | undefined
				const verb = typeof methodType === 'number' ? RequestMethod[methodType] : undefined
				if (verb === undefined) return null

				const methodLower = verb.toLowerCase()
				const methodEnum = NEST_VERB_TO_ACTION[methodLower]
				if (methodEnum === undefined) return null

				const fullRoute = `${baseRoute}/${route || ''}`.replace(/\/+/g, '/')
				return {
					method: methodEnum,
					url: fullRoute,
					name: method,
					description: actionDescriptionConverter(`${fullRoute}-${method}-${methodLower}`),
				}
			})
			.filter((action): action is NonNullable<typeof action> => action !== null)
			.filter((action) => action.method !== ActionMethodEnum.get)
		await this.actionModel.createMany({ data: actions, skipDuplicates: true })
	}

	async onModuleInit() {
		await this.$connect()
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
