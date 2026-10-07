import { INestApplication } from '@nestjs/common'
import { existsSync } from 'fs'
import { join } from 'path'
import { Server } from 'http'
import { AddressInfo } from 'net'
import request = require('supertest')
import { io, Socket } from 'socket.io-client'
import { createE2eApp } from './create-e2e-app'
import { expectGlobalModifySuccessJson, expectGlobalSuccessJson, expectGlobalSuccessJsonCreated } from './helpers/e2e-response'
import { PrismaService } from '../src/modules/shared/prisma'
import { ChatRecorder } from '../src/modules/chat/chat.recorder'
import { ReminderService, splitTelegramText } from '../src/modules/reminder/reminder.service'
import { PdfService } from '../src/modules/shared/pdf'

function auth(token: string) {
	return { Authorization: `Bearer ${token}` }
}

function once<T>(socket: Socket, event: string, ms = 8000): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), ms)
		socket.once(event, (payload: T) => {
			clearTimeout(timer)
			resolve(payload)
		})
	})
}

describe('Chat and reminders', () => {
	let app: INestApplication
	let server: Server
	let port: number
	let token: string
	let clientId: string
	let plainClientId: string
	let socket: Socket

	beforeAll(async () => {
		app = await createE2eApp()
		await app.listen(0, '127.0.0.1')
		server = app.getHttpServer()
		const address = server.address() as AddressInfo
		port = address.port

		const tag = `chat${Date.now()}`
		const tail = String(Date.now()).slice(-7)
		const actionsRes = await request(server).get('/action/many').query({ pageNumber: 1, pageSize: 5, pagination: true })
		expect(actionsRes.status).toBe(200)
		const actionId = actionsRes.body.data?.data?.[0]?.id as string
		expect(actionId).toBeTruthy()

		const staffPhone = `+99890${tail}`
		const staffRes = await request(server)
			.post('/staff/one')
			.send({
				fullname: `ChatStaff_${tag}`,
				phone: staffPhone,
				password: 'E2E_Test_99!',
				actionsToConnect: [actionId],
				pagesToConnect: ['chat', 'reminder'],
			})
		expectGlobalSuccessJsonCreated(staffRes)

		const sign = await request(server).post('/auth/sign-in').send({ phone: staffPhone, password: 'E2E_Test_99!' })
		expectGlobalSuccessJsonCreated(sign)
		token = sign.body.data?.tokens?.accessToken as string
		expect(token?.length).toBeGreaterThan(10)

		const clientRes = await request(server)
			.post('/client/one')
			.send({ fullname: `ChatClient_${tag}`, phone: `+99888${tail}` })
		expectGlobalSuccessJsonCreated(clientRes)
		clientId = clientRes.body.data?.id as string

		const plainRes = await request(server)
			.post('/client/one')
			.send({ fullname: `PlainClient_${tag}`, phone: `+99887${tail}` })
		expectGlobalSuccessJsonCreated(plainRes)
		plainClientId = plainRes.body.data?.id as string

		await app.get(PrismaService).botUserModel.create({
			data: { id: `9${Date.now()}`, clientId, language: 'uz' },
		})
	}, 120000)

	afterAll(async () => {
		socket?.disconnect()
		await app?.close()
	})

	it('rejects chat writes without a token', async () => {
		const res = await request(server).post('/chat/one').send({ clientId, text: 'yoq' })
		expect(res.status).toBe(401)
	})

	it('pushes a staff text message over the socket and stores it', async () => {
		socket = io(`http://127.0.0.1:${port}/chat`, { auth: { token }, transports: ['websocket'], forceNew: true })
		await once(socket, 'connect')
		const joined = await socket.emitWithAck('join', { clientId })
		expect(joined).toEqual({ ok: true })

		const pending = once<{ text: string; direction: string; id: string }>(socket, 'message')
		const res = await request(server).post('/chat/one').set(auth(token)).send({ clientId, text: 'salom mijoz' })
		expectGlobalSuccessJsonCreated(res)
		expect(res.body.warning?.is).toBe(true)
		expect(res.body.data.direction).toBe('out')
		expect(res.body.data.telegramMessageId).toBeNull()

		const live = await pending
		expect(live.text).toBe('salom mijoz')
		expect(live.direction).toBe('out')

		const list = await request(server).get('/chat/many').query({ clientId, pageSize: 20 }).set(auth(token))
		expectGlobalSuccessJson(list)
		expect(list.body.data.data.some((row: { text: string }) => row.text === 'salom mijoz')).toBe(true)
	})

	it('stores a client reply and a pdf in the same chat', async () => {
		const pending = once<{ direction: string; text: string; kind: string }>(socket, 'message')
		const inbound = await app.get(ChatRecorder).ingestTelegram({
			telegramUserId: (await app.get(PrismaService).botUserModel.findFirst({ where: { clientId } }))!.id,
			telegramMessageId: 501,
			text: 'javob',
		})
		expect(inbound?.direction).toBe('in')
		const live = await pending
		expect(live.text).toBe('javob')
		expect(live.direction).toBe('in')

		const pdfPending = once<{ kind: string; fileUrl: string | null; direction: string }>(socket, 'message')
		const saved = await app.get(ChatRecorder).save({
			clientId,
			direction: 'system',
			kind: 'document',
			text: 'xarid.pdf',
			file: { buffer: Buffer.from('%PDF-1.4 chat'), fileName: 'xarid.pdf', mimeType: 'application/pdf' },
		})
		expect(saved.kind).toBe('document')
		expect(saved.fileUrl).toContain('/uploads/chat/')
		expect(existsSync(join(process.cwd(), 'uploads', saved.fileUrl!.replace('/uploads/', '')))).toBe(true)
		const pdfLive = await pdfPending
		expect(pdfLive.kind).toBe('document')
		expect(pdfLive.direction).toBe('system')
	})

	it('uploads a file from the site and deletes a message in real time', async () => {
		const pending = once<{ kind: string; text: string | null }>(socket, 'message')
		const res = await request(server).post('/chat/file').set(auth(token)).field('clientId', clientId).field('text', 'hujjat').attach('file', Buffer.from('hello file'), 'note.txt')
		expectGlobalSuccessJsonCreated(res)
		expect(res.body.data.kind).toBe('document')
		const live = await pending
		expect(live.text).toBe('hujjat')
		expect(live.kind).toBe('document')

		const list = await request(server).get('/chat/many').query({ clientId, pageSize: 20 }).set(auth(token))
		const textRow = (list.body.data.data as { id: string; text: string }[]).find((row) => row.text === 'salom mijoz')
		expect(textRow?.id).toBeTruthy()

		const deletedEvent = once<{ id: string }>(socket, 'message-deleted')
		const deleted = await request(server).delete('/chat/one').query({ id: textRow!.id }).set(auth(token))
		expectGlobalSuccessJsonCreated(deleted)
		expect(deleted.body.data.telegramDeleted).toBe(false)
		expect(deleted.body.warning?.is).toBe(false)
		const event = await deletedEvent
		expect(event.id).toBe(textRow!.id)

		const after = await request(server).get('/chat/many').query({ clientId, pageSize: 50 }).set(auth(token))
		expect((after.body.data.data as { text: string }[]).some((row) => row.text === 'salom mijoz')).toBe(false)
	})

	it('builds a jas invoice pdf', async () => {
		const buffer = await app.get(PdfService).generateInvoicePdfBuffer2({
			id: 'pdf-test',
			date: new Date(),
			client: { fullname: 'JAS mijoz' },
			products: [],
			totalPrices: [],
		} as never)
		expect(buffer.subarray(0, 4).toString()).toBe('%PDF')
	})

	it('splits a long reminder digest', () => {
		const parts = splitTelegramText(`${'a'.repeat(2500)}\n${'b'.repeat(2500)}`, 4000)
		expect(parts.length).toBe(2)
		expect(parts.join('\n')).toContain('aaaa')
		expect(parts.join('\n')).toContain('bbbb')
	})

	it('sends due reminders once, skips clients without telegram, and stops after delete', async () => {
		const reminders = app.get(ReminderService)
		const created = await request(server).post('/reminder/one').set(auth(token)).send({
			clientId,
			startDate: '2020-01-01',
			description: 'qarz eslatmasi',
		})
		expectGlobalSuccessJsonCreated(created)
		const reminderId = created.body.data.id as string

		const first = await reminders.dispatchDue()
		expect(first.waitingForBot).toBeGreaterThanOrEqual(1)
		expect(first.digest).not.toContain('qarz eslatmasi')
		const still = await request(server).get('/reminder/one').query({ id: reminderId }).set(auth(token))
		expect(still.body.data.lastSentOn).toBeNull()

		const plain = await request(server).post('/reminder/one').set(auth(token)).send({
			clientId: plainClientId,
			startDate: '2020-01-01',
			description: 'telegram yoq eslatma',
		})
		expectGlobalSuccessJsonCreated(plain)
		const plainId = plain.body.data.id as string

		const second = await reminders.dispatchDue()
		expect(second.skippedNoTelegram).toBeGreaterThanOrEqual(1)
		expect(second.digest).toContain("telegram yo'q")
		expect(second.digest).toContain('telegram yoq eslatma')
		expect(second.channelDelivered).toBe(false)

		const sent = await request(server).get('/reminder/one').query({ id: plainId }).set(auth(token))
		expect(sent.body.data.lastSentOn).toBeTruthy()

		const third = await reminders.dispatchDue()
		expect(third.digest.includes('telegram yoq eslatma')).toBe(false)

		const future = await request(server).post('/reminder/one').set(auth(token)).send({
			clientId: plainClientId,
			startDate: '2099-01-01',
			description: 'kelajak eslatma',
		})
		expectGlobalSuccessJsonCreated(future)
		const futureId = future.body.data.id as string
		const patched = await request(server).patch('/reminder/one').query({ id: futureId }).set(auth(token)).send({ description: 'kechiktirilgan eslatma' })
		expectGlobalSuccessJsonCreated(patched)
		expect(patched.body.data.description).toBe('kechiktirilgan eslatma')

		const beforeStop = await reminders.dispatchDue()
		expect(beforeStop.digest.includes('kechiktirilgan eslatma')).toBe(false)

		const removed = await request(server).delete('/reminder/one').query({ id: plainId }).set(auth(token))
		expectGlobalModifySuccessJson(removed)
		const missing = await request(server).get('/reminder/one').query({ id: plainId }).set(auth(token))
		expect(missing.status).toBe(400)

		const list = await request(server).get('/reminder/many').query({ clientId: plainClientId, pageSize: 20 }).set(auth(token))
		expectGlobalSuccessJson(list)
		const descriptions = (list.body.data.data as { description: string }[]).map((row) => row.description)
		expect(descriptions).toContain('kechiktirilgan eslatma')
		expect(descriptions).not.toContain('telegram yoq eslatma')
	})
})
