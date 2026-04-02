import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap } from 'rxjs/operators'
import { magenta } from 'colors'

@Injectable()
export class RequestResponseInterceptor implements NestInterceptor {
	private readonly logger = new Logger(RequestResponseInterceptor.name)

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const request = context.switchToHttp().getRequest()

		const requestInfo: any = { ip: request.ip, url: request.url, method: request.method, startDate: new Date().toISOString() }
		const startTime = Date.now()

		return next.handle().pipe(
			tap({
				next: (data) => {
					const responseTime = Date.now() - startTime
					const responseInfo: any = {
						endDate: new Date(),
						responseTime: responseTime + ` ms`,
						result: {
							success: data?.success?.is ? data?.success?.is : data?.error?.is ? false : true,
							warning: data?.warning?.is ?? false,
							error: data?.error?.is ?? false,
						},
					}
					this.logger.debug(magenta({ ...requestInfo, ...responseInfo }))
				},
				error: (error) => {
					const responseTime = Date.now() - startTime
					const responseInfo: any = {
						endDate: new Date(),
						responseTime: responseTime + ` ms`,
						result: { success: false, warning: false, error: true },
					}
					this.logger.debug(magenta({ ...requestInfo, ...responseInfo }))
					this.logger.error(magenta(error?.response?.message))
				},
			}),
		)
	}
}
