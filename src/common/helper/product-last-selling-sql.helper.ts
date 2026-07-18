import { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { PrismaService } from '../../modules/shared/prisma'

export type ProductLastSellingSnapshot = { date: Date; count: number; price: Decimal | null }

type ProductLastSellingRow = {
	product_id: string
	selling_date: Date
	selling_count: number
	selling_price: unknown
	fallback_price: unknown
}

function decimalFromSql(raw: unknown): Decimal | null {
	if (raw == null) return null
	if (raw instanceof Decimal) return raw
	if (typeof raw === 'string' || typeof raw === 'number' || typeof raw === 'bigint') {
		return new Decimal(raw.toString())
	}
	if (typeof raw === 'object' && raw !== null && typeof (raw as { toString?: () => string }).toString === 'function') {
		return new Decimal((raw as { toString(): string }).toString())
	}
	return null
}

/** Mahsulot bo‘yicha oxirgi sotuv — Prisma nested `sellingMVs` o‘rniga bitta SQL batch. */
export async function fetchProductLastSellingByIds(prisma: PrismaService, productIds: string[], clientId?: string): Promise<Map<string, ProductLastSellingSnapshot>> {
	if (productIds.length === 0) return new Map()

	const ids = Prisma.sql`${Prisma.join(productIds.map((id) => Prisma.sql`${id}::uuid`))}`
	const clientFilter = clientId?.trim() ? Prisma.sql`AND s.client_id = ${clientId.trim()}::uuid` : Prisma.sql``

	const rows = await prisma.$queryRaw<ProductLastSellingRow[]>`
		SELECT DISTINCT ON (spm.product_id)
			spm.product_id::text,
			s.date AS selling_date,
			spm.count AS selling_count,
			(
				SELECT spmp.price
				FROM selling_product_mv_price spmp
				WHERE spmp.product_mv_id = spm.id
					AND spmp.deleted_at IS NULL
					AND spmp.type = 'selling'
				LIMIT 1
			) AS selling_price,
			(
				SELECT spmp.price
				FROM selling_product_mv_price spmp
				WHERE spmp.product_mv_id = spm.id
					AND spmp.deleted_at IS NULL
				ORDER BY spmp.created_at DESC
				LIMIT 1
			) AS fallback_price
		FROM selling_product_mv spm
		INNER JOIN selling s ON s.id = spm.selling_id
			AND s.deleted_at IS NULL
			AND s.status = 'accepted'
		WHERE spm.deleted_at IS NULL
			AND spm.product_id IN (${ids})
			${clientFilter}
		ORDER BY spm.product_id, s.date DESC
	`

	return new Map(
		rows.map((r) => [
			r.product_id,
			{
				date: r.selling_date,
				count: r.selling_count,
				price: decimalFromSql(r.selling_price) ?? decimalFromSql(r.fallback_price),
			},
		]),
	)
}
