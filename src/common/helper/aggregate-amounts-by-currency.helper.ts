import { Decimal } from '@prisma/client/runtime/library'

/** To'lov yoki qaytim qatorlarini `currencyId` bo'yicha yig'indi (to'lov turi hisobga olinmaydi). */
export function aggregateAmountsByCurrencyId(lines: { currencyId: string; amount: Decimal }[] | null | undefined): { currencyId: string; total: Decimal }[] {
	const map = new Map<string, Decimal>()
	for (const line of lines ?? []) {
		map.set(line.currencyId, (map.get(line.currencyId) ?? new Decimal(0)).plus(line.amount))
	}
	return Array.from(map.entries()).map(([currencyId, total]) => ({ currencyId, total }))
}
