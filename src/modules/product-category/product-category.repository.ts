import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared'
import {
	ProductCategoryCreateOneRequest,
	ProductCategoryDeleteOneRequest,
	ProductCategoryFindManyRequest,
	ProductCategoryFindOneRequest,
	ProductCategoryGetOneRequest,
	ProductCategoryUpdateOneRequest,
} from './interfaces'

@Injectable()
export class ProductCategoryRepository {
	constructor(private readonly prisma: PrismaService) {}

	async findMany(query: ProductCategoryFindManyRequest) {
		let paginationOptions = {}
		if (query.pagination) {
			paginationOptions = { take: query.pageSize, skip: (query.pageNumber - 1) * query.pageSize }
		}

		let nameFilter: Record<string, unknown> = {}
		if (query.search) {
			const searchWords = query.search.split(/\s+/).filter(Boolean)
			nameFilter = {
				[searchWords.length > 1 ? 'AND' : 'OR']: searchWords.map((word) => ({
					name: { contains: word, mode: 'insensitive' },
				})),
			}
		}

		return this.prisma.productCategoryModel.findMany({
			where: { ...nameFilter, name: query.name, deletedAt: null },
			select: { id: true, name: true, createdAt: true },
			orderBy: [{ name: 'asc' }],
			...paginationOptions,
		})
	}

	async countFindMany(query: ProductCategoryFindManyRequest) {
		let nameFilter: Record<string, unknown> = {}
		if (query.search) {
			const searchWords = query.search.split(/\s+/).filter(Boolean)
			nameFilter = {
				[searchWords.length > 1 ? 'AND' : 'OR']: searchWords.map((word) => ({
					name: { contains: word, mode: 'insensitive' },
				})),
			}
		}

		return this.prisma.productCategoryModel.count({
			where: { ...nameFilter, name: query.name, deletedAt: null },
		})
	}

	async findOne(query: ProductCategoryFindOneRequest) {
		return this.prisma.productCategoryModel.findFirst({
			where: { id: query.id, deletedAt: null },
			select: { id: true, name: true, createdAt: true },
		})
	}

	async getOne(query: ProductCategoryGetOneRequest) {
		return this.prisma.productCategoryModel.findFirst({
			where: { id: query.id, name: query.name, deletedAt: null },
		})
	}

	async createOne(body: ProductCategoryCreateOneRequest) {
		return this.prisma.productCategoryModel.create({
			data: { name: body.name },
		})
	}

	async updateOne(query: ProductCategoryFindOneRequest, body: ProductCategoryUpdateOneRequest) {
		return this.prisma.productCategoryModel.update({
			where: { id: query.id },
			data: { name: body.name },
		})
	}

	async deleteOne(query: ProductCategoryDeleteOneRequest) {
		return this.prisma.productCategoryModel.update({
			where: { id: query.id },
			data: { deletedAt: new Date() },
		})
	}
}
