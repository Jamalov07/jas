import { Prisma } from '@prisma/client'
import { PrismaService } from '../../modules/shared/prisma'

export type DebtAggregateRow = { client_id: string; currency_id: string; amount: unknown }

/** Mijoz qarzini SQL da hisoblash — `ClientService.calcDebtByCurrency` bilan bir xil mantiq, schema o‘zgarmaydi. */
export async function aggregateClientDebtByIds(prisma: PrismaService, clientIds: string[]): Promise<DebtAggregateRow[]> {
	if (clientIds.length === 0) return []

	const ids = Prisma.sql`${Prisma.join(clientIds.map((id) => Prisma.sql`${id}::uuid`))}`

	return prisma.$queryRaw<DebtAggregateRow[]>`
		WITH debt_lines AS (
			SELECT s.client_id, spmp.currency_id, spmp.total_price AS amount
			FROM selling s
			INNER JOIN selling_product_mv spm ON spm.selling_id = s.id AND spm.deleted_at IS NULL
			INNER JOIN selling_product_mv_price spmp ON spmp.product_mv_id = spm.id AND spmp.type = 'selling' AND spmp.deleted_at IS NULL
			WHERE s.status = 'accepted' AND s.deleted_at IS NULL AND s.client_id IN (${ids})

			UNION ALL

			SELECT s.client_id, pm.currency_id, -pm.amount
			FROM selling s
			INNER JOIN client_selling_payment pay ON pay.selling_id = s.id AND pay.deleted_at IS NULL
			INNER JOIN client_selling_payment_method pm ON pm.payment_id = pay.id AND pm.deleted_at IS NULL
			WHERE s.status = 'accepted' AND s.deleted_at IS NULL AND s.client_id IN (${ids})

			UNION ALL

			SELECT s.client_id, cm.currency_id, cm.amount
			FROM selling s
			INNER JOIN client_selling_payment pay ON pay.selling_id = s.id AND pay.deleted_at IS NULL
			INNER JOIN client_selling_change_method cm ON cm.payment_id = pay.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE s.status = 'accepted' AND s.deleted_at IS NULL AND s.client_id IN (${ids})

			UNION ALL

			SELECT r.client_id, rp.currency_id, -rp.total_price
			FROM "returning" r
			INNER JOIN returning_product_mv rpm ON rpm.returning_id = r.id AND rpm.deleted_at IS NULL
			INNER JOIN returning_product_mv_price rp ON rp.product_mv_id = rpm.id AND rp.type = 'selling' AND rp.deleted_at IS NULL
			WHERE r.status = 'accepted' AND r.deleted_at IS NULL AND r.client_id IN (${ids})

			UNION ALL

			SELECT r.client_id, pm.currency_id, pm.amount
			FROM "returning" r
			INNER JOIN client_returning_payment pay ON pay.returning_id = r.id AND pay.deleted_at IS NULL
			INNER JOIN client_returning_payment_method pm ON pm.payment_id = pay.id AND pm.deleted_at IS NULL
			WHERE r.status = 'accepted' AND r.deleted_at IS NULL AND r.client_id IN (${ids})

			UNION ALL

			SELECT r.client_id, cm.currency_id, cm.amount
			FROM "returning" r
			INNER JOIN client_returning_payment pay ON pay.returning_id = r.id AND pay.deleted_at IS NULL
			INNER JOIN client_returning_change_method cm ON cm.payment_id = pay.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE r.status = 'accepted' AND r.deleted_at IS NULL AND r.client_id IN (${ids})

			UNION ALL

			SELECT cp.client_id, pm.currency_id, -pm.amount
			FROM client_payment cp
			INNER JOIN client_payment_method pm ON pm.payment_id = cp.id AND pm.deleted_at IS NULL
			WHERE cp.deleted_at IS NULL AND cp.client_id IN (${ids})

			UNION ALL

			SELECT cp.client_id, cm.currency_id, CASE WHEN cm.type = 'cash' THEN cm.amount ELSE -cm.amount END
			FROM client_payment cp
			INNER JOIN client_payment_change_method cm ON cm.payment_id = cp.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE cp.deleted_at IS NULL AND cp.client_id IN (${ids})
		)
		SELECT client_id::text, currency_id::text, SUM(amount) AS amount
		FROM debt_lines
		GROUP BY client_id, currency_id
	`
}

/** Barcha faol mijozlar uchun qarz — statistika yig‘indisi (bitta SQL) */
export async function aggregateAllClientDebtRows(prisma: PrismaService): Promise<DebtAggregateRow[]> {
	return prisma.$queryRaw<DebtAggregateRow[]>`
		WITH debt_lines AS (
			SELECT s.client_id, spmp.currency_id, spmp.total_price AS amount
			FROM selling s
			INNER JOIN selling_product_mv spm ON spm.selling_id = s.id AND spm.deleted_at IS NULL
			INNER JOIN selling_product_mv_price spmp ON spmp.product_mv_id = spm.id AND spmp.type = 'selling' AND spmp.deleted_at IS NULL
			WHERE s.status = 'accepted' AND s.deleted_at IS NULL

			UNION ALL

			SELECT s.client_id, pm.currency_id, -pm.amount
			FROM selling s
			INNER JOIN client_selling_payment pay ON pay.selling_id = s.id AND pay.deleted_at IS NULL
			INNER JOIN client_selling_payment_method pm ON pm.payment_id = pay.id AND pm.deleted_at IS NULL
			WHERE s.status = 'accepted' AND s.deleted_at IS NULL

			UNION ALL

			SELECT s.client_id, cm.currency_id, cm.amount
			FROM selling s
			INNER JOIN client_selling_payment pay ON pay.selling_id = s.id AND pay.deleted_at IS NULL
			INNER JOIN client_selling_change_method cm ON cm.payment_id = pay.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE s.status = 'accepted' AND s.deleted_at IS NULL

			UNION ALL

			SELECT r.client_id, rp.currency_id, -rp.total_price
			FROM "returning" r
			INNER JOIN returning_product_mv rpm ON rpm.returning_id = r.id AND rpm.deleted_at IS NULL
			INNER JOIN returning_product_mv_price rp ON rp.product_mv_id = rpm.id AND rp.type = 'selling' AND rp.deleted_at IS NULL
			WHERE r.status = 'accepted' AND r.deleted_at IS NULL

			UNION ALL

			SELECT r.client_id, pm.currency_id, pm.amount
			FROM "returning" r
			INNER JOIN client_returning_payment pay ON pay.returning_id = r.id AND pay.deleted_at IS NULL
			INNER JOIN client_returning_payment_method pm ON pm.payment_id = pay.id AND pm.deleted_at IS NULL
			WHERE r.status = 'accepted' AND r.deleted_at IS NULL

			UNION ALL

			SELECT r.client_id, cm.currency_id, cm.amount
			FROM "returning" r
			INNER JOIN client_returning_payment pay ON pay.returning_id = r.id AND pay.deleted_at IS NULL
			INNER JOIN client_returning_change_method cm ON cm.payment_id = pay.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE r.status = 'accepted' AND r.deleted_at IS NULL

			UNION ALL

			SELECT cp.client_id, pm.currency_id, -pm.amount
			FROM client_payment cp
			INNER JOIN client_payment_method pm ON pm.payment_id = cp.id AND pm.deleted_at IS NULL
			WHERE cp.deleted_at IS NULL

			UNION ALL

			SELECT cp.client_id, cm.currency_id, CASE WHEN cm.type = 'cash' THEN cm.amount ELSE -cm.amount END
			FROM client_payment cp
			INNER JOIN client_payment_change_method cm ON cm.payment_id = cp.id AND cm.deleted_at IS NULL AND cm.type <> 'balance'
			WHERE cp.deleted_at IS NULL
		)
		SELECT dl.client_id::text, dl.currency_id::text, SUM(dl.amount) AS amount
		FROM debt_lines dl
		INNER JOIN client c ON c.id = dl.client_id AND c.deleted_at IS NULL
		GROUP BY dl.client_id, dl.currency_id
	`
}

export async function fetchClientLastSellingDates(prisma: PrismaService, clientIds: string[]): Promise<Map<string, Date>> {
	if (clientIds.length === 0) return new Map()

	const ids = Prisma.sql`${Prisma.join(clientIds.map((id) => Prisma.sql`${id}::uuid`))}`

	const rows = await prisma.$queryRaw<Array<{ client_id: string; last_date: Date }>>`
		SELECT client_id::text, MAX(date) AS last_date
		FROM selling
		WHERE status = 'accepted' AND deleted_at IS NULL AND client_id IN (${ids})
		GROUP BY client_id
	`

	return new Map(rows.map((r) => [r.client_id, r.last_date]))
}
