import { INestApplication } from '@nestjs/common'
import type { Response } from 'supertest'
import * as request from 'supertest'
import { createE2eApp } from './create-e2e-app'
import { E2E_PUBLIC_GET_EXCEL_MANY_ROUTES, E2E_PUBLIC_GET_JSON_ROUTES, LIST_QUERY } from './e2e-public-get-routes'
import { expectGlobalSuccessJson, expectGlobalSuccessJsonCreated, expectOkOrBinary, isJsonResponse, logResponse } from './helpers/e2e-response'

const FAKE_UUID = '00000000-0000-0000-0000-000000000001'

/** `POST` / `PATCH` with `@AuthOptions(true, true)` — unauthenticated must be 401 before handler. */
const STAFF_ONLY_MUTATIONS: { method: 'post' | 'patch'; path: string; query?: Record<string, string> }[] = [
	{ method: 'post', path: '/auth/sign-out' },
	{ method: 'post', path: '/selling/one' },
	{ method: 'patch', path: '/selling/one', query: { id: FAKE_UUID } },
	{ method: 'post', path: '/arrival/one' },
	{ method: 'patch', path: '/arrival/one', query: { id: FAKE_UUID } },
	{ method: 'post', path: '/client-payment/one' },
	{ method: 'post', path: '/supplier-payment/one' },
	{ method: 'post', path: '/staff-payment/one' },
	{ method: 'post', path: '/selling-product-mv/one' },
	{ method: 'patch', path: '/selling-product-mv/one', query: { id: FAKE_UUID } },
	{ method: 'post', path: '/arrival-product-mv/one' },
	{ method: 'patch', path: '/arrival-product-mv/one', query: { id: FAKE_UUID } },
	{ method: 'post', path: '/returning-product-mv/one' },
	{ method: 'patch', path: '/returning-product-mv/one', query: { id: FAKE_UUID } },
]

function expectUnauthorizedEnvelope(res: Response) {
	expect(res.status).toBe(401)
	expect(isJsonResponse(res)).toBe(true)
	expect(res.body).toMatchObject({
		success: expect.objectContaining({ is: false }),
		error: expect.objectContaining({ is: true }),
	})
}

describe('API smoke (e2e)', () => {
	let app: INestApplication
	let server: ReturnType<INestApplication['getHttpServer']>

	beforeAll(async () => {
		if (!process.env.DATABASE_URL) {
			throw new Error('DATABASE_URL is required for e2e (load .env or export DATABASE_URL).')
		}
		app = await createE2eApp()
		server = app.getHttpServer()
	})

	afterAll(async () => {
		await app?.close()
	})

	describe('GET list & statistics JSON', () => {
		it.each(E2E_PUBLIC_GET_JSON_ROUTES)('$path', async ({ path, query }) => {
			const res = await request(server)
				.get(path)
				.query(query ?? {})
			logResponse(`GET ${path}`, res)
			expect(res.status).toBe(200)
			expectGlobalSuccessJson(res)
		})
	})

	describe('GET excel many (binary or JSON)', () => {
		it.each(E2E_PUBLIC_GET_EXCEL_MANY_ROUTES)('%s', async (path) => {
			const res = await request(server).get(path).query(LIST_QUERY)
			logResponse(`GET ${path}`, res)
			expectOkOrBinary(res)
		})
	})

	describe('Auth', () => {
		it('GET /auth/profile without token → 401', async () => {
			const res = await request(server).get('/auth/profile')
			logResponse('GET /auth/profile', res)
			expectUnauthorizedEnvelope(res)
		})

		it('POST /auth/sign-in empty body → 400', async () => {
			const res = await request(server).post('/auth/sign-in').send({})
			logResponse('POST /auth/sign-in {}', res)
			expect(res.status).toBe(400)
		})

		it('POST /auth/sign-in wrong credentials → 401', async () => {
			const res = await request(server).post('/auth/sign-in').send({ phone: '+998901234567', password: '__wrong_password_e2e__' })
			logResponse('POST /auth/sign-in wrong', res)
			expectUnauthorizedEnvelope(res)
		})
	})

	describe('Staff-only mutations without Bearer → 401', () => {
		it.each(STAFF_ONLY_MUTATIONS)('$method $path', async ({ method, path, query }) => {
			const req = request(server)
				[method](path)
				.query(query ?? {})
			const res = method === 'post' ? await req.send({}) : await req.send({})
			logResponse(`${method.toUpperCase()} ${path}`, res)
			expectUnauthorizedEnvelope(res)
		})
	})

	const hasStaffCreds = Boolean(process.env.E2E_STAFF_PHONE && process.env.E2E_STAFF_PASSWORD)

	;(hasStaffCreds ? describe : describe.skip)('With E2E_STAFF_PHONE / E2E_STAFF_PASSWORD', () => {
		let accessToken = ''

		beforeAll(async () => {
			const res = await request(server).post('/auth/sign-in').send({ phone: process.env.E2E_STAFF_PHONE, password: process.env.E2E_STAFF_PASSWORD })
			logResponse('POST /auth/sign-in (staff)', res)
			expectGlobalSuccessJsonCreated(res)
			accessToken = res.body?.data?.tokens?.accessToken
			expect(typeof accessToken).toBe('string')
			expect(accessToken.length).toBeGreaterThan(10)
		})

		it('GET /auth/profile with Bearer → 200', async () => {
			const res = await request(server).get('/auth/profile').set('Authorization', `Bearer ${accessToken}`)
			logResponse('GET /auth/profile (authed)', res)
			expect(res.status).toBe(200)
			expectGlobalSuccessJson(res)
		})

		it('POST /selling/one with Bearer but empty body → 400', async () => {
			const res = await request(server).post('/selling/one').set('Authorization', `Bearer ${accessToken}`).send({})
			logResponse('POST /selling/one (authed, empty)', res)
			expect(res.status).toBe(400)
		})
	})
})
