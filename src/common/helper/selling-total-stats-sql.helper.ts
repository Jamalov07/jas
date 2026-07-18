import { PrismaService } from '../../modules/shared/prisma'

export type SellingTotalByCurrencyRow = { currency_id: string; symbol: string; total: unknown }

/** Qabul qilingan sotuvlar summasi — faqat `status = accepted`, o‘chirilmagan hujjatlar */
export async function fetchSellingTotalsByCurrencyForPeriod(prisma: PrismaService, start: Date, end: Date): Promise<SellingTotalByCurrencyRow[]> {
	return prisma.$queryRaw<SellingTotalByCurrencyRow[]>`
		SELECT c.id::text AS currency_id, c.symbol, SUM(spmp.total_price) AS total
		FROM selling_product_mv_price spmp
		INNER JOIN selling_product_mv spm ON spm.id = spmp.product_mv_id AND spm.deleted_at IS NULL
		INNER JOIN selling s ON s.id = spm.selling_id AND s.deleted_at IS NULL AND s.status = 'accepted'
		INNER JOIN currency c ON c.id = spmp.currency_id
		WHERE spmp.type = 'selling' AND spmp.deleted_at IS NULL
			AND s.date >= ${start} AND s.date <= ${end}
		GROUP BY c.id, c.symbol
	`
}
