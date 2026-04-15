import { Decimal } from '@prisma/client/runtime/library'
import { CurrencyBrief, currencyBriefMapFromRows, withCurrencyBriefTotalMany } from './attach-currency-brief.helper'
import { fillCurrencyTotalsByActiveIds } from './fill-calc-by-active-currencies.helper'

export type PaymentLikeForCalc = { methods?: Array<{ currencyId: string; amount: Decimal }> | null }

export async function enrichedCalcByCurrencyForPayments(
	payments: PaymentLikeForCalc[],
	deps: {
		findAllActiveIds(): Promise<string[]>
		findBriefByIds(ids: string[]): Promise<CurrencyBrief[]>
	},
): Promise<Array<{ currencyId: string; total: Decimal; currency: CurrencyBrief }>> {
	const activeCurrencyIds = await deps.findAllActiveIds()
	const calcMap = new Map<string, Decimal>()
	for (const payment of payments) {
		for (const method of payment.methods ?? []) {
			const curr = calcMap.get(method.currencyId) ?? new Decimal(0)
			calcMap.set(method.currencyId, curr.plus(method.amount))
		}
	}
	const filled = fillCurrencyTotalsByActiveIds(activeCurrencyIds, calcMap)
	const briefMap = currencyBriefMapFromRows(await deps.findBriefByIds(activeCurrencyIds))
	return withCurrencyBriefTotalMany(filled, briefMap)
}
