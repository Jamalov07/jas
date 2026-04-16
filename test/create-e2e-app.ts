import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { Request, Response } from 'express'
import { AppModule } from '../src/app.module'
import { AllExceptionFilter, AuthGuard, DecimalToNumberInterceptor, RequestQueryTimezoneInterceptor, RequestResponseInterceptor, TimezoneInterceptor } from '../src/common'

export async function createE2eApp(): Promise<INestApplication> {
	const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
	const app = moduleRef.createNestApplication()

	const http = app.getHttpAdapter().getInstance()
	http.get('/health', (_req: Request, res: Response) => res.status(200).send('alive'))

	app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
	app.useGlobalGuards(app.get(AuthGuard))
	app.useGlobalInterceptors(new DecimalToNumberInterceptor(), new RequestQueryTimezoneInterceptor(), new TimezoneInterceptor(), new RequestResponseInterceptor())
	app.useGlobalFilters(new AllExceptionFilter())

	await app.init()
	return app
}
