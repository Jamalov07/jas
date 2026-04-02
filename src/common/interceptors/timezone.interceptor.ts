import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs/operators'
import moment from 'moment-timezone'

@Injectable()
export class TimezoneInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler) {
		const request = context.switchToHttp().getRequest()
		const timezone = 'Asia/Tashkent'
		return next.handle().pipe(map((data) => this.convertTimezone(data, timezone)))
	}

	private convertTimezone(obj: any, timezone: string) {
		if (!obj || typeof obj !== 'object') return obj

		const dateFields = ['createdAt', 'updatedAt', 'deletedAt']

		const convert = (value: any) => {
			if (value instanceof Date) {
				return moment(value).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
			} else if (Array.isArray(value)) {
				return value.map((item) => this.convertTimezone(item, timezone))
			} else if (typeof value === 'object') {
				return this.convertTimezone(value, timezone)
			}
			return value
		}

		for (const key of Object.keys(obj)) {
			if (dateFields.includes(key) && obj[key] instanceof Date) {
				obj[key] = convert(obj[key])
			} else if (typeof obj[key] === 'object') {
				obj[key] = convert(obj[key])
			}
		}

		return obj
	}
}
