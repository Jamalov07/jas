import { Decimal } from '@prisma/client/runtime/library'

export type CurrencyBrief = { id: string; name: string; symbol: string }

export function currencyBriefMapFromRows(rows: CurrencyBrief[]): Map<string, CurrencyBrief> {
	return new Map(rows.map((r) => [r.id, r]))
}

const fallbackBrief = (currencyId: string): CurrencyBrief => ({ id: currencyId, name: '', symbol: '' })

export function withCurrencyBrief<T extends { currencyId: string }>(row: T, map: Map<string, CurrencyBrief>): T & { currency: CurrencyBrief } {
	return { ...row, currency: map.get(row.currencyId) ?? fallbackBrief(row.currencyId) }
}

export function withCurrencyBriefMany<T extends { currencyId: string }>(rows: T[], map: Map<string, CurrencyBrief>): Array<T & { currency: CurrencyBrief }> {
	return rows.map((r) => withCurrencyBrief(r, map))
}

/** For rows with `amount` (debt / totals) */
export function withCurrencyBriefAmountMany(
	rows: Array<{ currencyId: string; amount: Decimal }>,
	map: Map<string, CurrencyBrief>,
): Array<{ currencyId: string; amount: Decimal; currency: CurrencyBrief }> {
	return withCurrencyBriefMany(rows, map)
}
