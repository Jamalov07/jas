import { Decimal } from '@prisma/client/runtime/library'
import type { SellingDebtByCurrencyRow, SellingFindOneData, SellingPaymentData } from '../interfaces'

/** Ko‘p valyutali qarz / summa — Telegram caption va PDF ostki qismi uchun */
export function formatSellingMoneyRows(rows: { amount: Decimal; currency: { symbol: string } }[] | undefined): string {
	if (!rows?.length) return '0'
	return rows.map((r) => `${r.amount.toNumber()} ${r.currency.symbol}`).join(' + ')
}

export function formatSellingTotalPrices(totalPrices: SellingFindOneData['totalPrices']): string {
	if (!totalPrices?.length) return '0'
	return totalPrices.map((t) => `${t.total.toNumber()} ${(t as { currency?: { symbol?: string } }).currency?.symbol ?? ''}`).join(' + ')
}

/** Shu hujjat bo‘yicha to‘langan summa (faqat `paymentMethods`; qaytim alohida hisoblanmaydi). */
export function formatSellingPaymentTotals(payment: SellingPaymentData | undefined): string {
	if (!payment?.paymentMethods?.length) return '0'
	const map = new Map<string, { total: Decimal; symbol: string }>()
	for (const m of payment.paymentMethods) {
		const sym = m.currency?.symbol ?? ''
		const cur = map.get(m.currencyId)
		map.set(m.currencyId, {
			total: (cur?.total ?? new Decimal(0)).plus(m.amount),
			symbol: sym || cur?.symbol || '',
		})
	}
	return [...map.values()].map((v) => `${v.total.toNumber()} ${v.symbol}`).join(' + ')
}

/** Telegram kanal caption (emoji + buyurtma raqami). */
export function buildSellingChannelSummaryBlock(selling: SellingFindOneData & { clientDebtBeforeSelling?: SellingDebtByCurrencyRow[] }, formatDateFn: (d: Date) => string): string {
	const orderNo = selling.publicId ?? selling.id
	const buyer = selling.client?.fullname ?? ''
	const oldDebt = formatSellingMoneyRows(selling.clientDebtBeforeSelling)
	const saleTotal = formatSellingTotalPrices(selling.totalPrices)
	const paid = formatSellingPaymentTotals(selling.payment)
	const newDebt = formatSellingMoneyRows(selling.client?.debtByCurrency as SellingDebtByCurrencyRow[] | undefined)

	return (
		`🧾 Sotuv - ${orderNo}\n` +
		// `📋 Buyurtma raqami: ${orderNo}\n` +
		// `🕐 Vaqt: ${formatDateFn(selling.date)}\n\n` +
		`👤 Xaridor: ${buyer}\n\n` +
		`📉 Eski qarz: ${oldDebt}\n` +
		`💰 Jami sotuv summasi: ${saleTotal}\n` +
		`💳 Jami to'lov: ${paid}\n` +
		`📊 Yangi oxirgi qarz: ${newDebt}\n`
	)
}

/** Kanalga yuboriladigan PDF: «Jami» qatoridan keyin — emoji yo‘q, faqat xulosalar. */
export function buildSellingPdfFooterSummaryBlock(
	selling: SellingFindOneData & { clientDebtBeforeSelling?: SellingDebtByCurrencyRow[] },
	formatDateFn: (d: Date) => string,
): string {
	const time = formatDateFn(selling.date)
	const buyer = selling.client?.fullname ?? ''
	const oldDebt = formatSellingMoneyRows(selling.clientDebtBeforeSelling)
	const saleTotal = formatSellingTotalPrices(selling.totalPrices)
	const paid = formatSellingPaymentTotals(selling.payment)
	const newDebt = formatSellingMoneyRows(selling.client?.debtByCurrency as SellingDebtByCurrencyRow[] | undefined)

	return [`Sotuv vaqti: ${time}`, `Xaridor: ${buyer}`, `Eski qarz: ${oldDebt}`, `Jami sotuv summasi: ${saleTotal}`, `Jami to'lov: ${paid}`, `Yangi qarz: ${newDebt}`].join('\n')
}
