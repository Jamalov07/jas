import { INestApplication } from '@nestjs/common'
import * as request from 'supertest'
import { createE2eApp } from './create-e2e-app'

describe('App (e2e)', () => {
	let app: INestApplication

	beforeAll(async () => {
		app = await createE2eApp()
	})

	afterAll(async () => {
		await app.close()
	})

	it('GET /health → 200 alive', () => {
		return request(app.getHttpServer()).get('/health').expect(200).expect('alive')
	})
})
