import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		if (context['contextType'] === 'telegraf') {
			return next.handle()
		}
		return next.handle().pipe(
			map((data) => {
				if (data === undefined || data === null) {
					return {}
				}
				return JSON.parse(JSON.stringify(data, (_, value) => (typeof value === 'bigint' ? value.toString() : value)))
			}),
		)
	}
}
