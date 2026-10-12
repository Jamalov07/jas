import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
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
			this.prisma.chatMessageModel.findMany({ where, ...pagination, orderBy: { createdAt: 'desc' }, select: chatMessageSelect }),
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

	markRead(clientId: string, at: Date) {
		return this.prisma.clientModel.update({ where: { id: clientId }, data: { chatReadAt: at } })
	}

	private unreadCounts(ids: string[]) {
		const clientIds = Prisma.join(ids.map((id) => Prisma.sql`${id}::uuid`))
		return this.prisma.$queryRaw<Array<{ client_id: string; unread: number }>>`
			SELECT m.client_id, COUNT(*)::int AS unread
			FROM chat_message m
			INNER JOIN client c ON c.id = m.client_id
			WHERE m.deleted_at IS NULL
				AND m.direction = 'in'
				AND m.client_id IN (${clientIds})
				AND (c.chat_read_at IS NULL OR m.created_at > c.chat_read_at)
			GROUP BY m.client_id
		`
	}

	async inbox() {
		const rows = await this.prisma.chatMessageModel.findMany({
			where: { deletedAt: null, client: { deletedAt: null } },
			distinct: ['clientId'],
			orderBy: [{ clientId: 'asc' }, { createdAt: 'desc' }],
			select: {
				text: true,
				kind: true,
				fileName: true,
				direction: true,
				createdAt: true,
				client: {
					select: {
						id: true,
						fullname: true,
						phone: true,
						telegram: { select: { isActive: true } },
					},
				},
			},
		})
		const sorted = [...rows].sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
		const ids = sorted.map((row) => row.client.id)
		const counts = ids.length ? await this.unreadCounts(ids) : []
		const countByClient = new Map(counts.map((row) => [row.client_id, Number(row.unread) || 0]))
		return sorted.map((row) => ({
			id: row.client.id,
			fullname: row.client.fullname,
			phone: row.client.phone || '',
			telegram: row.client.telegram ? { isActive: row.client.telegram.isActive } : null,
			incomingCount: countByClient.get(row.client.id) || 0,
			unreadCount: countByClient.get(row.client.id) || 0,
			lastMessage: {
				text: row.text,
				kind: row.kind,
				fileName: row.fileName,
				direction: row.direction,
				createdAt: row.createdAt,
			},
		}))
	}
}
