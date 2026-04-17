import { Decimal } from '@prisma/client/runtime/library'
import { CurrencyBrief, currencyBriefMapFromRows, withCurrencyBriefTotalMany } from './attach-currency-brief.helper'
import { fillCurrencyTotalsByActiveIds } from './fill-calc-by-active-currencies.helper'

export type PaymentLikeForCalc = {
	paymentMethods?: Array<{ currencyId: string; amount: Decimal }> | null
	changeMethods?: Array<{ currencyId: string; amount: Decimal }> | null
	/** Staff payments (`StaffPaymentModel`) still use the `methods` relation name */
	methods?: Array<{ currencyId: string; amount: Decimal }> | null
}

/** Valyuta IDlari: to‘lov qatorlarida uchraganlar (tartibni saqlab) */
export function collectCurrencyIdsFromPayments(payments: PaymentLikeForCalc[]): string[] {
	const ids: string[] = []
	for (const p of payments) {
		for (const m of p.paymentMethods ?? p.methods ?? []) {
			if (m?.currencyId) ids.push(m.currencyId)
		}
		for (const ch of p.changeMethods ?? []) {
			if (ch?.currencyId) ids.push(ch.currencyId)
		}
	}
	return ids
}

/**
 * Jadval ustunlari: avvalo faol valyutalar, keyin faqat to‘lovlarda uchraydigan (masalan, arxivlangan) IDlar.
 * Aks holda `fillCurrencyTotalsByActiveIds` faqat faollarni ko‘rsatadi va boshqa valyutadagi summa 0 ko‘rinadi.
 */
export function resolvePaymentColumnCurrencyIds(activeCurrencyIds: string[], payments: PaymentLikeForCalc[]): string[] {
	const seen = new Set<string>()
	const out: string[] = []
	for (const id of activeCurrencyIds) {
		if (id && !seen.has(id)) {
			seen.add(id)
			out.push(id)
		}
	}
	for (const id of collectCurrencyIdsFromPayments(payments)) {
		if (id && !seen.has(id)) {
			seen.add(id)
			out.push(id)
		}
	}
	return out
}

export async function enrichedCalcByCurrencyForPayments(
	payments: PaymentLikeForCalc[],
	deps: {
		findAllActiveIds(): Promise<string[]>
		findBriefByIds(ids: string[]): Promise<CurrencyBrief[]>
	},
): Promise<Array<{ currencyId: string; total: Decimal; currency: CurrencyBrief }>> {
	const activeCurrencyIds = await deps.findAllActiveIds()
	const columnCurrencyIds = resolvePaymentColumnCurrencyIds(activeCurrencyIds, payments)
	const calcMap = new Map<string, Decimal>()
	for (const payment of payments) {
		for (const method of payment.paymentMethods ?? payment.methods ?? []) {
			const curr = calcMap.get(method.currencyId) ?? new Decimal(0)
			calcMap.set(method.currencyId, curr.plus(method.amount))
		}
		for (const ch of payment.changeMethods ?? []) {
			const curr = calcMap.get(ch.currencyId) ?? new Decimal(0)
			calcMap.set(ch.currencyId, curr.minus(ch.amount))
		}
	}
	const filled = fillCurrencyTotalsByActiveIds(columnCurrencyIds, calcMap)
	const briefMap = currencyBriefMapFromRows(await deps.findBriefByIds(columnCurrencyIds))
	return withCurrencyBriefTotalMany(filled, briefMap)
}
