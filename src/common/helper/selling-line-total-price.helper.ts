import { Decimal } from '@prisma/client/runtime/library'

/**
 * Sotish qatori umumiy narxi: `price * count * (100 - discount%) / 100`.
 * `discount` — foiz (0–100), berilmasa yoki 0 bo‘lsa `price * count`.
 */
export function calcSellingLineTotalPrice(
	price: Decimal | number | string,
	count: number,
	discountPercent?: Decimal | number | string | null,
): Decimal {
	const p = new Decimal(price)
	const c = Number.isFinite(count) ? count : 0
	let d = new Decimal(discountPercent ?? 0)
	if (d.lt(0)) d = new Decimal(0)
	if (d.gt(100)) d = new Decimal(100)
	const factor = new Decimal(100).minus(d).div(100)
	return p.mul(c).mul(factor)
}
