import type { Response } from 'supertest'

const JSON_CT = 'application/json'

export function isJsonResponse(res: Response): boolean {
	const ct = res.headers['content-type']
	return typeof ct === 'string' && ct.includes(JSON_CT)
}

/** Success envelope from controllers (matches GlobalResponse + data). */
export function expectGlobalSuccessJson(res: Response): void {
	expect(isJsonResponse(res)).toBe(true)
	expect(res.body).toMatchObject({
		success: expect.objectContaining({ is: true }),
		error: expect.objectContaining({ is: false }),
	})
}

/** Mutations that return `data: null` with success envelope. */
export function expectGlobalModifySuccessJson(res: Response): void {
	expect(isJsonResponse(res)).toBe(true)
	expect([200, 201]).toContain(res.status)
	expect(res.body).toMatchObject({
		data: null,
		success: expect.objectContaining({ is: true }),
		error: expect.objectContaining({ is: false }),
	})
}

/** POST create endpoints may respond with 200 or 201 depending on Nest defaults. */
export function expectGlobalSuccessJsonCreated(res: Response): void {
	expect([200, 201]).toContain(res.status)
	expectGlobalSuccessJson(res)
}

export function expectOkOrBinary(res: Response): void {
	expect(res.status).toBe(200)
	if (isJsonResponse(res)) {
		expectGlobalSuccessJson(res)
	} else {
		const ct = String(res.headers['content-type'] ?? '')
		expect(ct.length).toBeGreaterThan(0)
	}
}

export function logResponse(label: string, res: Response): void {
	if (process.env.E2E_LOG_RESPONSES !== '1') {
		return
	}
	const preview =
		isJsonResponse(res) && res.body !== undefined
			? JSON.stringify(res.body, null, 2).slice(0, 8000)
			: String(res.text ?? res.body).slice(0, 2000)
	// eslint-disable-next-line no-console
	console.log(`[e2e] ${label} status=${res.status}\n${preview}${preview.length >= 8000 ? '\n…(truncated)' : ''}`)
}
