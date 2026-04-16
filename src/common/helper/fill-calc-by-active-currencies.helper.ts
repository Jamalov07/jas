import { ChangeMethodEnum, PaymentMethodEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

/** One row per active currency; missing totals default to 0 */
export function fillCurrencyTotalsByActiveIds(activeCurrencyIds: string[], totals: Map<string, Decimal>): { currencyId: string; total: Decimal }[] {
	return activeCurrencyIds.map((currencyId) => ({
		currencyId,
		total: totals.get(currencyId) ?? new Decimal(0),
	}))
}

const paymentMethodEnumValues = Object.values(PaymentMethodEnum).filter((v): v is PaymentMethodEnum => typeof v === 'string')
const changeMethodEnumValues = Object.values(ChangeMethodEnum).filter((v): v is ChangeMethodEnum => typeof v === 'string')

/** Keys in `totals` must match `${PaymentMethodEnum}_${currencyId}` */
export function fillPaymentMethodCurrencyTotalsByActiveIds(
	activeCurrencyIds: string[],
	totals: Map<string, Decimal>,
): Array<{ type: PaymentMethodEnum; currencyId: string; total: Decimal }> {
	const out: Array<{ type: PaymentMethodEnum; currencyId: string; total: Decimal }> = []
	for (const type of paymentMethodEnumValues) {
		for (const currencyId of activeCurrencyIds) {
			const key = `${type}_${currencyId}`
			out.push({ type, currencyId, total: totals.get(key) ?? new Decimal(0) })
		}
	}
	return out
}

/** Keys in `totals` must match `change_${ChangeMethodEnum}_${currencyId}` */
export function fillChangeMethodCurrencyTotalsByActiveIds(
	activeCurrencyIds: string[],
	totals: Map<string, Decimal>,
): Array<{ type: ChangeMethodEnum; currencyId: string; total: Decimal }> {
	const out: Array<{ type: ChangeMethodEnum; currencyId: string; total: Decimal }> = []
	for (const type of changeMethodEnumValues) {
		for (const currencyId of activeCurrencyIds) {
			const key = `change_${type}_${currencyId}`
			out.push({ type, currencyId, total: totals.get(key) ?? new Decimal(0) })
		}
	}
	return out
}
