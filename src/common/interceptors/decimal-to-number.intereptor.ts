import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Decimal } from '@prisma/client/runtime/library'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(map((data) => this.convertDecimalToNumber(data)))
	}

	private convertDecimalToNumber(value: any): any {
		if (value instanceof Decimal) {
			return value.toNumber()
		}

		if (value instanceof Date) {
			return value // 🔒 Date obyektini as is saqlaymiz
		}

		if (Array.isArray(value)) {
			return value.map((item) => this.convertDecimalToNumber(item))
		}

		if (value !== null && typeof value === 'object') {
			const newObj = {}
			for (const key in value) {
				if (Object.prototype.hasOwnProperty.call(value, key)) {
					newObj[key] = this.convertDecimalToNumber(value[key])
				}
			}
			return newObj
		}

		return value
	}
}
