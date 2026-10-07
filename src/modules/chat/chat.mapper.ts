import { ChatMessageView } from './chat.types'

type ChatRow = {
	id: string
	clientId: string
	direction: ChatMessageView['direction']
	kind: ChatMessageView['kind']
	text: string | null
	filePath: string | null
	fileName: string | null
	mimeType: string | null
	telegramMessageId: number | null
	staffId: string | null
	sellingId: string | null
	createdAt: Date
	staff?: { id: string; fullname: string } | null
}

export function toChatMessageView(row: ChatRow): ChatMessageView {
	return {
		id: row.id,
		clientId: row.clientId,
		direction: row.direction,
		kind: row.kind,
		text: row.text,
		fileName: row.fileName,
		mimeType: row.mimeType,
		fileUrl: row.filePath ? `/uploads/${row.filePath}` : null,
		telegramMessageId: row.telegramMessageId,
		staffId: row.staffId,
		staff: row.staff ?? null,
		sellingId: row.sellingId,
		createdAt: row.createdAt,
	}
}

export const chatMessageSelect = {
	id: true,
	clientId: true,
	direction: true,
	kind: true,
	text: true,
	filePath: true,
	fileName: true,
	mimeType: true,
	telegramMessageId: true,
	staffId: true,
	sellingId: true,
	createdAt: true,
	staff: { select: { id: true, fullname: true } },
} as const
