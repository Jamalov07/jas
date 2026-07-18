import { Prisma } from '@prisma/client'
import { PrismaService } from '../../modules/shared/prisma'

export type SupplierDebtAggregateRow = { supplier_id: string; currency_id: string; amount: unknown }

/** Ta'minotchi qarzini SQL da — `SupplierService.calcDebtByCurrency` bilan mos. */
export async function aggregateSupplierDebtByIds(prisma: PrismaService, supplierIds: string[]): Promise<SupplierDebtAggregateRow[]> {
	if (supplierIds.length === 0) return []

	const ids = Prisma.sql`${Prisma.join(supplierIds.map((id) => Prisma.sql`${id}::uuid`))}`

	return prisma.$queryRaw<SupplierDebtAggregateRow[]>`
		WITH debt_lines AS (
			SELECT a.supplier_id, apmp.currency_id, apmp.total_price AS amount
			FROM arrival a
			INNER JOIN arrival_product_mv apm ON apm.arrival_id = a.id AND apm.deleted_at IS NULL
			INNER JOIN arrival_product_mv_price apmp ON apmp.product_mv_id = apm.id AND apmp.type = 'cost' AND apmp.deleted_at IS NULL
			WHERE a.deleted_at IS NULL AND a.supplier_id IN (${ids})

			UNION ALL

			SELECT a.supplier_id, pm.currency_id, -pm.amount
			FROM arrival a
			INNER JOIN supplier_arrival_payment pay ON pay.arrival_id = a.id AND pay.deleted_at IS NULL
			INNER JOIN supplier_arrival_payment_method pm ON pm.payment_id = pay.id AND pm.deleted_at IS NULL
			WHERE a.deleted_at IS NULL AND a.supplier_id IN (${ids})

			UNION ALL

			SELECT a.supplier_id, cm.currency_id, cm.amount
			FROM arrival a
			INNER JOIN supplier_arrival_payment pay ON pay.arrival_id = a.id AND pay.deleted_at IS NULL
			INNER JOIN supplier_arrival_change_method cm ON cm.payment_id = pay.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE a.deleted_at IS NULL AND a.supplier_id IN (${ids})

			UNION ALL

			SELECT sp.supplier_id, pm.currency_id, -pm.amount
			FROM supplier_payment sp
			INNER JOIN supplier_payment_method pm ON pm.payment_id = sp.id AND pm.deleted_at IS NULL
			WHERE sp.deleted_at IS NULL AND sp.supplier_id IN (${ids})

			UNION ALL

			SELECT sp.supplier_id, cm.currency_id, CASE WHEN cm.type = 'cash' THEN cm.amount ELSE -cm.amount END
			FROM supplier_payment sp
			INNER JOIN supplier_payment_change_method cm ON cm.payment_id = sp.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE sp.deleted_at IS NULL AND sp.supplier_id IN (${ids})
		)
		SELECT supplier_id::text, currency_id::text, SUM(amount) AS amount
		FROM debt_lines
		GROUP BY supplier_id, currency_id
	`
}

/** Barcha faol ta'minotchilar uchun qarz — statistika yig‘indisi (bitta SQL) */
export async function aggregateAllSupplierDebtRows(prisma: PrismaService): Promise<SupplierDebtAggregateRow[]> {
	return prisma.$queryRaw<SupplierDebtAggregateRow[]>`
		WITH debt_lines AS (
			SELECT a.supplier_id, apmp.currency_id, apmp.total_price AS amount
			FROM arrival a
			INNER JOIN arrival_product_mv apm ON apm.arrival_id = a.id AND apm.deleted_at IS NULL
			INNER JOIN arrival_product_mv_price apmp ON apmp.product_mv_id = apm.id AND apmp.type = 'cost' AND apmp.deleted_at IS NULL
			WHERE a.deleted_at IS NULL

			UNION ALL

			SELECT a.supplier_id, pm.currency_id, -pm.amount
			FROM arrival a
			INNER JOIN supplier_arrival_payment pay ON pay.arrival_id = a.id AND pay.deleted_at IS NULL
			INNER JOIN supplier_arrival_payment_method pm ON pm.payment_id = pay.id AND pm.deleted_at IS NULL
			WHERE a.deleted_at IS NULL

			UNION ALL

			SELECT a.supplier_id, cm.currency_id, cm.amount
			FROM arrival a
			INNER JOIN supplier_arrival_payment pay ON pay.arrival_id = a.id AND pay.deleted_at IS NULL
			INNER JOIN supplier_arrival_change_method cm ON cm.payment_id = pay.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE a.deleted_at IS NULL

			UNION ALL

			SELECT sp.supplier_id, pm.currency_id, -pm.amount
			FROM supplier_payment sp
			INNER JOIN supplier_payment_method pm ON pm.payment_id = sp.id AND pm.deleted_at IS NULL
			WHERE sp.deleted_at IS NULL

			UNION ALL

			SELECT sp.supplier_id, cm.currency_id, CASE WHEN cm.type = 'cash' THEN cm.amount ELSE -cm.amount END
			FROM supplier_payment sp
			INNER JOIN supplier_payment_change_method cm ON cm.payment_id = sp.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE sp.deleted_at IS NULL
		)
		SELECT dl.supplier_id::text, dl.currency_id::text, SUM(dl.amount) AS amount
		FROM debt_lines dl
		INNER JOIN supplier sup ON sup.id = dl.supplier_id AND sup.deleted_at IS NULL
		GROUP BY dl.supplier_id, dl.currency_id
	`
}

export async function fetchSupplierLastArrivalDates(prisma: PrismaService, supplierIds: string[]): Promise<Map<string, Date>> {
	if (supplierIds.length === 0) return new Map()

	const ids = Prisma.sql`${Prisma.join(supplierIds.map((id) => Prisma.sql`${id}::uuid`))}`

	const rows = await prisma.$queryRaw<Array<{ supplier_id: string; last_date: Date }>>`
		SELECT supplier_id::text, MAX(date) AS last_date
		FROM arrival
		WHERE deleted_at IS NULL AND supplier_id IN (${ids})
		GROUP BY supplier_id
	`

	return new Map(rows.map((r) => [r.supplier_id, r.last_date]))
}
