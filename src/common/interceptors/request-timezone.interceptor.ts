import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable } from 'rxjs'
import * as moment from 'moment-timezone'

@Injectable()
export class RequestQueryTimezoneInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		if (context['contextType'] === 'telegraf') {
			return next.handle()
		}
		const req = context.switchToHttp().getRequest()
		const timezone = 'Asia/Tashkent'

		const adjusted = this.adjustStartEndDates(req.query, timezone)
		Object.assign(req.query, adjusted)

		return next.handle()
	}

	private adjustStartEndDates(query: any, timezone: string): Record<string, any> {
		const fields = ['startDate', 'endDate']
		const result: Record<string, any> = {}

		for (const field of fields) {
			const value = query[field]
			if (!value) continue

			if (typeof value === 'string' && this.isIsoDate(value)) {
				let date = moment.tz(value, timezone).toDate()
				date = new Date(date.setHours(date.getHours() + 5, 0, 0, 0))
				result[field] = date
			} else if (value instanceof Date) {
				let date = moment(value).tz(timezone).toDate()
				date = new Date(date.setHours(date.getHours() + 5, 0, 0, 0))
				result[field] = date
			}
		}

		return result
	}

	private isIsoDate(value: string): boolean {
		return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
	}
}
