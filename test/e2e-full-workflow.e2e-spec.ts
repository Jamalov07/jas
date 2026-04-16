import { INestApplication } from '@nestjs/common'
import { PaymentMethodEnum } from '@prisma/client'
import type { Response } from 'supertest'
import * as request from 'supertest'
import { DeleteMethodEnum } from '../src/common/enums/delete-method.enums'
import { createE2eApp } from './create-e2e-app'
import { E2E_PUBLIC_GET_EXCEL_MANY_ROUTES, E2E_PUBLIC_GET_JSON_ROUTES, LIST_QUERY } from './e2e-public-get-routes'
import { expectGlobalModifySuccessJson, expectGlobalSuccessJson, expectGlobalSuccessJsonCreated, expectOkOrBinary, isJsonResponse, logResponse } from './helpers/e2e-response'

type Ctx = {
	tag: string
	currencyId: string
	productId: string
	clientId: string
	supplierId: string
	staffAId: string
	staffBId: string
	staffPhoneA: string
	staffPhoneB: string
	staffPassword: string
	accessToken: string
	refreshToken: string
	actionId: string
	permissionId: string
	sellingId: string
	sellingMvId: string
	arrivalId: string
	arrivalMvId: string
	returningId: string
	returningMvId: string
	clientPaymentId: string
	supplierPaymentId: string
	staffPaymentId: string
}

function auth(t: string) {
	return { Authorization: `Bearer ${t}` }
}

function expectUnauthorized(res: Response) {
	expect(res.status).toBe(401)
	expect(isJsonResponse(res)).toBe(true)
	expect(res.body).toMatchObject({
		success: expect.objectContaining({ is: false }),
		error: expect.objectContaining({ is: true }),
	})
}

describe('E2E full workflow (seed + CRUD + every endpoint)', () => {
	let app: INestApplication
	let server: ReturnType<INestApplication['getHttpServer']>
	let ctx: Ctx

	beforeAll(async () => {
		if (!process.env.DATABASE_URL) {
			throw new Error('DATABASE_URL is required for e2e.')
		}
		app = await createE2eApp()
		server = app.getHttpServer()
		const tag = `e2e${Date.now()}`
		const tail = String(Date.now()).slice(-7)
		const staffPassword = 'E2E_Test_99!'
		const staffPhoneA = `+99890${tail}`
		const staffPhoneB = `+99891${tail}`

		const actionsRes = await request(server).get('/action/many').query(LIST_QUERY)
		expect(actionsRes.status).toBe(200)
		expectGlobalSuccessJson(actionsRes)
		const actionRows = actionsRes.body.data?.data ?? []
		expect(Array.isArray(actionRows)).toBe(true)
		expect(actionRows.length).toBeGreaterThan(0)
		const actionId = actionRows[0].id as string

		const cur = await request(server)
			.post('/currency/one')
			.send({
				name: `CUR_${tag}`,
				symbol: 'T',
				exchangeRate: 1,
				isActive: true,
			})
		expectGlobalSuccessJsonCreated(cur)
		const curMany = await request(server)
			.get('/currency/many')
			.query({ ...LIST_QUERY, search: `CUR_${tag}` })
		expect(curMany.status).toBe(200)
		expectGlobalSuccessJson(curMany)
		const currencyRow = (curMany.body.data?.data ?? []).find((c: { name: string }) => c.name === `CUR_${tag}`)
		expect(currencyRow?.id).toBeDefined()
		const currencyId = currencyRow.id as string

		const prod = await request(server)
			.post('/product/one')
			.send({
				name: `PR_${tag}`,
				count: 1000,
				minAmount: 0,
				description: 'e2e',
				prices: {
					cost: { price: 10, currencyId },
					selling: { price: 20, currencyId },
					wholesale: { price: 15, currencyId },
				},
			})
		expectGlobalSuccessJsonCreated(prod)
		const prodMany = await request(server)
			.get('/product/many')
			.query({ ...LIST_QUERY, search: `PR_${tag}` })
		expect(prodMany.status).toBe(200)
		expectGlobalSuccessJson(prodMany)
		const prodRow = (prodMany.body.data?.data ?? []).find((p: { name: string }) => p.name === `PR_${tag}`)
		expect(prodRow?.id).toBeDefined()
		const productId = prodRow.id as string

		const cli = await request(server)
			.post('/client/one')
			.send({
				fullname: `CL_${tag}`,
				phone: `+99888${tail}`,
			})
		expectGlobalSuccessJsonCreated(cli)
		const clientId = cli.body.data?.id as string

		const sup = await request(server)
			.post('/supplier/one')
			.send({
				fullname: `SU_${tag}`,
				phone: `+99887${tail}`,
			})
		expectGlobalSuccessJsonCreated(sup)
		const supplierId = sup.body.data?.id as string

		const staffA = await request(server)
			.post('/staff/one')
			.send({
				fullname: `StaffA_${tag}`,
				phone: staffPhoneA,
				password: staffPassword,
				actionsToConnect: [actionId],
				pagesToConnect: [],
			})
		expectGlobalSuccessJsonCreated(staffA)
		const staffAId = staffA.body.data?.id as string

		const staffB = await request(server)
			.post('/staff/one')
			.send({
				fullname: `StaffB_${tag}`,
				phone: staffPhoneB,
				password: staffPassword,
				actionsToConnect: [actionId],
				pagesToConnect: [],
			})
		expectGlobalSuccessJsonCreated(staffB)
		const staffBId = staffB.body.data?.id as string

		const patchCurStaff = await request(server).patch('/staff/one').query({ id: staffAId }).send({ currencyId })
		expect(patchCurStaff.status).toBe(200)
		expectGlobalModifySuccessJson(patchCurStaff)

		const sign = await request(server).post('/auth/sign-in').send({ phone: staffPhoneA, password: staffPassword })
		expectGlobalSuccessJsonCreated(sign)
		const accessToken = sign.body.data?.tokens?.accessToken as string
		const refreshToken = sign.body.data?.tokens?.refreshToken as string
		expect(accessToken?.length).toBeGreaterThan(10)
		expect(refreshToken?.length).toBeGreaterThan(10)

		const perm = await request(server)
			.post('/permission/one')
			.send({ name: `perm_${tag}` })
		expectGlobalModifySuccessJson(perm)
		const permMany = await request(server)
			.get('/permission/many')
			.query({ ...LIST_QUERY, name: `perm_${tag}` })
		expect(permMany.status).toBe(200)
		expectGlobalSuccessJson(permMany)
		const permRow = (permMany.body.data?.data ?? []).find((p: { name: string }) => p.name === `perm_${tag}`)
		expect(permRow).toBeTruthy()
		const permissionId = permRow.id as string

		const sell = await request(server).post('/selling/one').set(auth(accessToken)).send({
			clientId,
			date: new Date().toISOString(),
			send: false,
		})
		expectGlobalSuccessJsonCreated(sell)
		const sellingId = sell.body.data?.id as string

		const arr = await request(server).post('/arrival/one').set(auth(accessToken)).send({
			supplierId,
			date: new Date().toISOString(),
		})
		expectGlobalSuccessJsonCreated(arr)
		const arrivalId = arr.body.data?.id as string

		const ret = await request(server).post('/returning/one').set(auth(accessToken)).send({
			clientId,
			date: new Date().toISOString(),
		})
		expectGlobalSuccessJsonCreated(ret)
		const returningId = ret.body.data?.id as string

		const cp = await request(server)
			.post('/client-payment/one')
			.set(auth(accessToken))
			.send({
				clientId,
				description: `cp_${tag}`,
				paymentMethods: [{ type: PaymentMethodEnum.cash, currencyId, amount: 100 }],
			})
		expectGlobalSuccessJsonCreated(cp)
		const clientPaymentId = cp.body.data?.id as string

		const sp = await request(server)
			.post('/supplier-payment/one')
			.set(auth(accessToken))
			.send({
				supplierId,
				description: `sp_${tag}`,
				paymentMethods: [{ type: PaymentMethodEnum.cash, currencyId, amount: 50 }],
			})
		expectGlobalSuccessJsonCreated(sp)
		const supplierPaymentId = sp.body.data?.id as string

		const stp = await request(server)
			.post('/staff-payment/one')
			.set(auth(accessToken))
			.send({
				employeeId: staffBId,
				description: `stp_${tag}`,
				method: { currencyId, amount: 25 },
			})
		expectGlobalSuccessJsonCreated(stp)
		const staffPaymentId = stp.body.data?.id as string

		const smv = await request(server).post('/selling-product-mv/one').set(auth(accessToken)).send({
			sellingId,
			productId,
			count: 1,
			price: 20,
			currencyId,
		})
		expectGlobalModifySuccessJson(smv)
		const smvList = await request(server)
			.get('/selling-product-mv/many')
			.query({ ...LIST_QUERY, sellingId })
		expect(smvList.status).toBe(200)
		expectGlobalSuccessJson(smvList)
		const smvRow = (smvList.body.data?.data ?? [])[0]
		expect(smvRow?.id).toBeDefined()
		const sellingMvId = smvRow.id as string

		const amv = await request(server).post('/arrival-product-mv/one').set(auth(accessToken)).send({
			arrivalId,
			productId,
			count: 1,
			cost: 10,
			costCurrencyId: currencyId,
			price: 20,
			priceCurrencyId: currencyId,
		})
		expectGlobalModifySuccessJson(amv)
		const amvList = await request(server)
			.get('/arrival-product-mv/many')
			.query({ ...LIST_QUERY, arrivalId })
		expect(amvList.status).toBe(200)
		expectGlobalSuccessJson(amvList)
		const amvRow = (amvList.body.data?.data ?? [])[0]
		const arrivalMvId = amvRow.id as string

		const rmv = await request(server).post('/returning-product-mv/one').set(auth(accessToken)).send({
			returningId,
			productId,
			count: 1,
			price: 20,
			currencyId,
		})
		expectGlobalModifySuccessJson(rmv)
		const rmvList = await request(server)
			.get('/returning-product-mv/many')
			.query({ ...LIST_QUERY, returningId })
		expect(rmvList.status).toBe(200)
		expectGlobalSuccessJson(rmvList)
		const rmvRow = (rmvList.body.data?.data ?? [])[0]
		const returningMvId = rmvRow.id as string

		ctx = {
			tag,
			currencyId,
			productId,
			clientId,
			supplierId,
			staffAId,
			staffBId,
			staffPhoneA,
			staffPhoneB,
			staffPassword,
			accessToken,
			refreshToken,
			actionId,
			permissionId,
			sellingId,
			sellingMvId,
			arrivalId,
			arrivalMvId,
			returningId,
			returningMvId,
			clientPaymentId,
			supplierPaymentId,
			staffPaymentId,
		}
	})

	afterAll(async () => {
		await app?.close()
	})

	it('GET /health', async () => {
		const res = await request(server).get('/health')
		expect(res.status).toBe(200)
		expect(res.text).toBe('alive')
	})

	it('GET /auth/profile (Bearer access)', async () => {
		const res = await request(server).get('/auth/profile').set(auth(ctx.accessToken))
		logResponse('GET /auth/profile', res)
		expect(res.status).toBe(200)
		expectGlobalSuccessJson(res)
		expect(res.body.data).toMatchObject({ id: ctx.staffAId, phone: ctx.staffPhoneA })
	})

	it('POST /auth/refresh-token (Bearer refresh)', async () => {
		const res = await request(server).post('/auth/refresh-token').set(auth(ctx.refreshToken))
		logResponse('POST /auth/refresh-token', res)
		expectGlobalSuccessJsonCreated(res)
		expect(res.body.data?.tokens?.accessToken).toBeDefined()
	})

	it('GET /action/one + PATCH /action/one', async () => {
		const one = await request(server).get('/action/one').query({ id: ctx.actionId })
		expect(one.status).toBe(200)
		expectGlobalSuccessJson(one)
		const patch = await request(server)
			.patch('/action/one')
			.query({ id: ctx.actionId })
			.send({ description: `e2e_${ctx.tag}` })
		expect(patch.status).toBe(200)
		expectGlobalModifySuccessJson(patch)
	})

	it('GET /permission/one + PATCH /permission/one', async () => {
		const one = await request(server).get('/permission/one').query({ id: ctx.permissionId })
		expect(one.status).toBe(200)
		expectGlobalSuccessJson(one)
		const patch = await request(server)
			.patch('/permission/one')
			.query({ id: ctx.permissionId })
			.send({ name: `perm_up_${ctx.tag}` })
		expect(patch.status).toBe(200)
		expectGlobalModifySuccessJson(patch)
	})

	it('GET/PATCH currency, product, client, supplier, staff', async () => {
		for (const path of [
			['/currency/one', { id: ctx.currencyId }],
			['/product/one', { id: ctx.productId }],
			['/client/one', { id: ctx.clientId }],
			['/supplier/one', { id: ctx.supplierId }],
			['/staff/one', { id: ctx.staffAId }],
		] as const) {
			const g = await request(server)
				.get(path[0])
				.query(path[1] as any)
			expect(g.status).toBe(200)
			expectGlobalSuccessJson(g)
		}
		const patchCurrency = await request(server).patch('/currency/one').query({ id: ctx.currencyId }).send({ symbol: 'T2' })
		expect(patchCurrency.status).toBe(200)
		expectGlobalModifySuccessJson(patchCurrency)
		const patchProduct = await request(server)
			.patch('/product/one')
			.query({ id: ctx.productId })
			.send({ name: `PR_up_${ctx.tag}` })
		expect(patchProduct.status).toBe(200)
		expectGlobalModifySuccessJson(patchProduct)
		const patchClient = await request(server)
			.patch('/client/one')
			.query({ id: ctx.clientId })
			.send({ fullname: `CL_up_${ctx.tag}` })
		expect(patchClient.status).toBe(200)
		expectGlobalModifySuccessJson(patchClient)
		const patchSupplier = await request(server)
			.patch('/supplier/one')
			.query({ id: ctx.supplierId })
			.send({ fullname: `SU_up_${ctx.tag}` })
		expect(patchSupplier.status).toBe(200)
		expectGlobalModifySuccessJson(patchSupplier)
		const patchStaff = await request(server)
			.patch('/staff/one')
			.query({ id: ctx.staffAId })
			.send({ fullname: `StA_up_${ctx.tag}` })
		expect(patchStaff.status).toBe(200)
		expectGlobalModifySuccessJson(patchStaff)
	})

	it('GET selling / arrival / returning / payments (one + many)', async () => {
		const pairs: [string, Record<string, string>][] = [
			['/selling/one', { id: ctx.sellingId }],
			['/arrival/one', { id: ctx.arrivalId }],
			['/returning/one', { id: ctx.returningId }],
			['/client-payment/one', { id: ctx.clientPaymentId }],
			['/supplier-payment/one', { id: ctx.supplierPaymentId }],
			['/staff-payment/one', { id: ctx.staffPaymentId }],
			['/selling-product-mv/one', { id: ctx.sellingMvId }],
			['/arrival-product-mv/one', { id: ctx.arrivalMvId }],
			['/returning-product-mv/one', { id: ctx.returningMvId }],
		]
		for (const [path, q] of pairs) {
			const res = await request(server).get(path).query(q)
			logResponse(`GET ${path}`, res)
			expect(res.status).toBe(200)
			expectGlobalSuccessJson(res)
		}
		for (const path of ['/selling/many', '/arrival/many', '/returning/many', '/client-payment/many', '/supplier-payment/many', '/staff-payment/many']) {
			const res = await request(server).get(path).query(LIST_QUERY)
			expect(res.status).toBe(200)
			expectGlobalSuccessJson(res)
		}
	})

	it('PATCH selling, arrival, returning, payments, MVs (staff auth where required)', async () => {
		const patchSell = await request(server).patch('/selling/one').query({ id: ctx.sellingId }).set(auth(ctx.accessToken)).send({ send: false })
		expect(patchSell.status).toBe(200)
		expectGlobalModifySuccessJson(patchSell)
		const patchArr = await request(server).patch('/arrival/one').query({ id: ctx.arrivalId }).set(auth(ctx.accessToken)).send({})
		expect(patchArr.status).toBe(200)
		expectGlobalModifySuccessJson(patchArr)
		const patchRet = await request(server).patch('/returning/one').query({ id: ctx.returningId }).send({})
		expect(patchRet.status).toBe(200)
		expectGlobalModifySuccessJson(patchRet)
		const patchCp = await request(server)
			.patch('/client-payment/one')
			.query({ id: ctx.clientPaymentId })
			.send({ description: `cp2_${ctx.tag}` })
		expect(patchCp.status).toBe(200)
		expectGlobalModifySuccessJson(patchCp)
		const patchSp = await request(server)
			.patch('/supplier-payment/one')
			.query({ id: ctx.supplierPaymentId })
			.send({ description: `sp2_${ctx.tag}` })
		expect(patchSp.status).toBe(200)
		expectGlobalModifySuccessJson(patchSp)
		const patchStp = await request(server)
			.patch('/staff-payment/one')
			.query({ id: ctx.staffPaymentId })
			.send({ description: `stp2_${ctx.tag}` })
		expect(patchStp.status).toBe(200)
		expectGlobalModifySuccessJson(patchStp)
		const patchSmv = await request(server).patch('/selling-product-mv/one').query({ id: ctx.sellingMvId }).set(auth(ctx.accessToken)).send({ count: 2 })
		expect(patchSmv.status).toBe(200)
		expectGlobalModifySuccessJson(patchSmv)
		const patchAmv = await request(server).patch('/arrival-product-mv/one').query({ id: ctx.arrivalMvId }).set(auth(ctx.accessToken)).send({ count: 2 })
		expect(patchAmv.status).toBe(200)
		expectGlobalModifySuccessJson(patchAmv)
		const patchRmv = await request(server).patch('/returning-product-mv/one').query({ id: ctx.returningMvId }).set(auth(ctx.accessToken)).send({ count: 2 })
		expect(patchRmv.status).toBe(200)
		expectGlobalModifySuccessJson(patchRmv)
	})

	it('GET public catalog (all list + stats + day-close) + POST day-close', async () => {
		for (const { path, query } of E2E_PUBLIC_GET_JSON_ROUTES) {
			const res = await request(server)
				.get(path)
				.query(query ?? {})
			logResponse(`GET ${path}`, res)
			expect(res.status).toBe(200)
			expectGlobalSuccessJson(res)
		}
		const close = await request(server).post('/common/day-close').send({})
		logResponse('POST /common/day-close', close)
		expect([200, 201, 400]).toContain(close.status)
		if (close.status === 200) {
			expectGlobalModifySuccessJson(close)
		} else {
			expect(isJsonResponse(close)).toBe(true)
		}
	})

	it('Excel downloads (many + one)', async () => {
		for (const path of E2E_PUBLIC_GET_EXCEL_MANY_ROUTES) {
			const res = await request(server).get(path).query(LIST_QUERY)
			logResponse(`GET ${path}`, res)
			expectOkOrBinary(res)
		}
		const excelOne: [string, Record<string, string>][] = [
			['/client/excel-download/one', { id: ctx.clientId }],
			['/client/excel-with-product-download/one', { id: ctx.clientId }],
			['/supplier/excel-download/one', { id: ctx.supplierId }],
			['/supplier/excel-with-product-download/one', { id: ctx.supplierId }],
			['/arrival/excel-download/one', { id: ctx.arrivalId }],
			['/selling/excel-download/one', { id: ctx.sellingId }],
			['/returning/excel-download/one', { id: ctx.returningId }],
		]
		for (const [path, q] of excelOne) {
			const res = await request(server).get(path).query(q)
			logResponse(`GET ${path}`, res)
			expect(res.status).toBe(200)
			if (isJsonResponse(res)) {
				expectGlobalSuccessJson(res)
			} else {
				expect(String(res.headers['content-type'] ?? '').length).toBeGreaterThan(0)
			}
		}
	})

	it('Auth: sign-in validation + GET /auth/profile without token', async () => {
		const bad = await request(server).post('/auth/sign-in').send({})
		expect(bad.status).toBe(400)
		const prof = await request(server).get('/auth/profile')
		expectUnauthorized(prof)
	})

	it('POST /auth/sign-out', async () => {
		const res = await request(server).post('/auth/sign-out').set(auth(ctx.accessToken)).send({})
		logResponse('POST /auth/sign-out', res)
		expectGlobalModifySuccessJson(res)
	})

	it('DELETE / soft cascade (MV → movements → payments → core)', async () => {
		const soft = DeleteMethodEnum.soft
		const del = async (path: string, id: string) => {
			const res = await request(server).delete(path).query({ id, method: soft })
			logResponse(`DELETE ${path}`, res)
			expectGlobalModifySuccessJson(res)
		}
		await del('/returning-product-mv/one', ctx.returningMvId)
		await del('/arrival-product-mv/one', ctx.arrivalMvId)
		await del('/selling-product-mv/one', ctx.sellingMvId)
		await del('/staff-payment/one', ctx.staffPaymentId)
		await del('/supplier-payment/one', ctx.supplierPaymentId)
		await del('/client-payment/one', ctx.clientPaymentId)
		await del('/returning/one', ctx.returningId)
		await del('/arrival/one', ctx.arrivalId)
		await del('/selling/one', ctx.sellingId)
		await del('/permission/one', ctx.permissionId)
		await del('/product/one', ctx.productId)
		await del('/client/one', ctx.clientId)
		await del('/supplier/one', ctx.supplierId)
		await del('/staff/one', ctx.staffBId)
		await del('/staff/one', ctx.staffAId)
		await del('/currency/one', ctx.currencyId)
	})
})
