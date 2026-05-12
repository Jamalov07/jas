import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Decimal } from '@prisma/client/runtime/library'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class DecimalToNumberInterceptor implements NestInterceptor {
	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		return next.handle().pipe(map((data) => convertDecimal(data)))
	}
}

/**
 * Modul darajasida free-function sifatida — `this` binding overhead yo'q.
 * `hasOwnProperty` o'rniga `Object.keys` ishlatiladi (prototip fieldlarini o'tkazib yuboradi).
 * Primitive va Date larda darhol qaytadi (eng ko'p uchraydigan holat).
 */
function convertDecimal(value: unknown): unknown {
	if (value === null || value === undefined) return value

	// Eng tez-tez uchraydigan primitiv turlar — birinchi tekshiriladi
	if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') return value

	if (value instanceof Decimal) return value.toNumber()

	if (value instanceof Date) return value

	if (Array.isArray(value)) {
		const len = value.length
		const out = new Array(len)
		for (let i = 0; i < len; i++) out[i] = convertDecimal(value[i])
		return out
	}

	if (typeof value === 'object') {
		const keys = Object.keys(value as object)
		const out: Record<string, unknown> = {}
		for (let i = 0; i < keys.length; i++) {
			const k = keys[i]
			out[k] = convertDecimal((value as Record<string, unknown>)[k])
		}
		return out
	}

	return value
}
