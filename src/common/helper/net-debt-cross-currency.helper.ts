import { Decimal } from '@prisma/client/runtime/library'

/**
 * Bir nechta valyutadagi qarz qatorlarini `currency.exchange_rate` bo‘yicha bir-biriga qarama qarama (+ / −) bo‘lsa qisqartirish.
 * `exchangeRate` — bazaviy ekvivalent bir birlik valyuta uchun (masalan: 1 USD = 12 000 UZS bo‘lsa USD uchun 12 000, UZS uchun 1).
 *
 * - Barcha valyutalar **kirishda noldan farqli** bo‘lgan qatorlar chiqishda ham qoladi; to‘liq offset bo‘lganlar **0** bilan qaytadi.
 * - Barcha qoldiqlar **bir xil ishorada** bo‘lsa (hammasi ≥ 0 yoki hammasi ≤ 0), kross-valyuta qisqartirish qilinmaydi.
 * - + va − aralash bo‘lsa: `net_ref = sum(amount[c] * rate[c])` (bitta bazada). Qoldiq **USD/UZS “avvalo” emas** — qaysi valyutaning
 *   `|amount * rate|` moduli eng katta bo‘lsa, `net_ref / rate[shu_valyuta]` shu valyutada qaytariladi, qolganlari **0**.
 * - Valyuta belgisi (`symbol`) faqat `|amount*rate|` teng bo‘lganda barqaror tanlash uchun ishlatiladi.
 */
export function netDebtCrossCurrencyRows(
	entries: Array<{ currencyId: string; amount: Decimal }>,
	rateByCurrencyId: Map<string, Decimal>,
	symbolByCurrencyId: Map<string, string>,
): Array<{ currencyId: string; amount: Decimal }> {
	const merged = new Map<string, Decimal>()
	const orderedIds: string[] = []
	for (const e of entries) {
		if (!e.amount || e.amount.isZero()) continue
		if (!merged.has(e.currencyId)) orderedIds.push(e.currencyId)
		merged.set(e.currencyId, (merged.get(e.currencyId) ?? new Decimal(0)).plus(e.amount))
	}

	const amountOf = (cid: string): Decimal => merged.get(cid) ?? new Decimal(0)

	const activeKeys = orderedIds.filter((k) => !amountOf(k).isZero())
	if (activeKeys.length === 0) return []

	if (activeKeys.length === 1) {
		const k = activeKeys[0]
		return [{ currencyId: k, amount: amountOf(k) }]
	}

	for (const k of activeKeys) {
		const r = rateByCurrencyId.get(k) ?? new Decimal(0)
		if (r.lte(0)) {
			return activeKeys.map((cid) => ({ currencyId: cid, amount: amountOf(cid) }))
		}
	}

	const hasPositive = activeKeys.some((k) => amountOf(k).gt(0))
	const hasNegative = activeKeys.some((k) => amountOf(k).lt(0))

	if (!hasPositive || !hasNegative) {
		return activeKeys.map((cid) => ({ currencyId: cid, amount: amountOf(cid) }))
	}

	const refAbsOf = (cid: string): Decimal => {
		const rk = rateByCurrencyId.get(cid) ?? new Decimal(0)
		return amountOf(cid).mul(rk).abs()
	}

	let bestMag = refAbsOf(activeKeys[0])
	const tied: string[] = [activeKeys[0]]
	for (let i = 1; i < activeKeys.length; i++) {
		const k = activeKeys[i]
		const mag = refAbsOf(k)
		if (mag.gt(bestMag)) {
			bestMag = mag
			tied.length = 0
			tied.push(k)
		} else if (mag.eq(bestMag)) {
			tied.push(k)
		}
	}

	const tieBreak = (a: string, b: string): number => {
		const sa = symbolByCurrencyId.get(a) ?? ''
		const sb = symbolByCurrencyId.get(b) ?? ''
		const c = sa.localeCompare(sb)
		if (c !== 0) return c
		return a.localeCompare(b)
	}
	const targetId = tied.sort(tieBreak)[0]

	const rTarget = rateByCurrencyId.get(targetId) ?? new Decimal(0)
	if (rTarget.lte(0)) {
		return activeKeys.map((cid) => ({ currencyId: cid, amount: amountOf(cid) }))
	}
	let sumRef = new Decimal(0)
	for (const k of activeKeys) {
		const rk = rateByCurrencyId.get(k) ?? new Decimal(0)
		sumRef = sumRef.plus(amountOf(k).mul(rk))
	}
	const net = sumRef.div(rTarget)

	return activeKeys.map((cid) => ({
		currencyId: cid,
		amount: cid === targetId ? net : new Decimal(0),
	}))
}
