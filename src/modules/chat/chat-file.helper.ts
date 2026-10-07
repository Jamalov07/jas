import { randomUUID } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export async function saveChatFile(clientId: string, fileName: string, buffer: Buffer): Promise<{ filePath: string; fileName: string }> {
	const safeName = fileName.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'file'
	const dir = join(process.cwd(), 'uploads', 'chat', clientId)
	await mkdir(dir, { recursive: true })
	const storedName = `${randomUUID()}-${safeName}`
	await writeFile(join(dir, storedName), buffer)
	return { filePath: `chat/${clientId}/${storedName}`, fileName: safeName }
}
