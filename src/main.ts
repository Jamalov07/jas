import { NestFactory, repl } from '@nestjs/core'
import { json, Request, Response } from 'express'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { appConfig } from '@config'
import { AppModule } from './app.module'
import { RequestResponseInterceptor, AuthGuard, AllExceptionFilter, DecimalToNumberInterceptor, TimezoneInterceptor, RequestQueryTimezoneInterceptor } from '@common'
import compression from 'compression'

async function bootstrap() {
	const app = await NestFactory.create<INestApplication>(AppModule, { forceCloseConnections: true })

	// await repl(AppModule)

	app.use(compression())

	app.use('/health', (req: Request, res: Response) => res.status(200).send('alive'))

	app.use(json({ limit: '50mb' }))

	app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

	app.useGlobalGuards(app.get(AuthGuard))
	app.useGlobalInterceptors(new DecimalToNumberInterceptor())
	app.useGlobalInterceptors(new RequestQueryTimezoneInterceptor())
	app.useGlobalInterceptors(new TimezoneInterceptor())
	app.useGlobalInterceptors(new RequestResponseInterceptor())

	app.useGlobalFilters(new AllExceptionFilter())

	app.enableCors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', allowedHeaders: 'Content-Type, Authorization' })

	const swaggerConfig = new DocumentBuilder().build()
	const document = SwaggerModule.createDocument(app, swaggerConfig)
	SwaggerModule.setup('docs', app, document, {})

	await app.listen(appConfig().port, appConfig().host, () => {
		console.log(appConfig())
		console.log(`works!`)
	})
}
bootstrap()
