import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared/prisma'
import { chatMessageSelect, toChatMessageView } from './chat.mapper'

@Injectable()
export class ChatRepository {
	constructor(private readonly prisma: PrismaService) {}

	async findMany(query: { clientId: string; pageNumber?: number; pageSize?: number; pagination?: boolean }) {
		const pageNumber = query.pageNumber || 1
		const pageSize = query.pageSize || 10
		const where = { clientId: query.clientId, deletedAt: null }
		const pagination = query.pagination !== false ? { take: pageSize, skip: (pageNumber - 1) * pageSize } : {}
		const [rows, totalCount] = await Promise.all([
			this.prisma.chatMessageModel.findMany({ where, ...pagination, select: chatMessageSelect }),
			this.prisma.chatMessageModel.count({ where }),
		])
		return {
			data: rows.map(toChatMessageView),
			totalCount,
			pageSize: rows.length,
			pagesCount: query.pagination === false ? 1 : Math.ceil(totalCount / pageSize),
		}
	}

	async findOne(id: string) {
		return this.prisma.chatMessageModel.findFirst({
			where: { id, deletedAt: null },
			select: {
				...chatMessageSelect,
				client: { select: { telegram: { select: { id: true, isActive: true } } } },
			},
		})
	}

	async softDelete(id: string) {
		return this.prisma.chatMessageModel.update({ where: { id }, data: { deletedAt: new Date() } })
	}
}
