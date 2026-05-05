import { jasLogoBase64 } from './jas-logo-base-64'
import { kasLogoBase64 } from './kas-logo-base-64'
export { jasInstagramQrCodeBase64 } from './jas-instagram-qr-code-base-64'
export { jasTelegramQrCodeBase64 } from './jas-telegram-qr-code-base-64'
import 'dotenv/config'

/**
 * PDF invoice logotipi.
 * 1) `PDF_LOGO_BRAND=jas` yoki `kas` (ustuvor)
 * 2) Aks holda legacy: `APP` (har qanday registrda `jas`) bo‘lsa jas
 *
 * Docker: `docker-compose` `PDF_LOGO_BRAND` yoki `.env`.
 */
export function resolvePdfLogoBase64(): string {
	const p = process.env.PDF_LOGO_BRAND?.trim().toLowerCase()
	if (p === 'jas' || p === 'kas') {
		return p === 'kas' ? kasLogoBase64 : jasLogoBase64
	}
	return process.env.APP?.trim().toLowerCase() === 'jas' ? jasLogoBase64 : kasLogoBase64
}

/**
 * QR/header uchun brend nomi — `resolvePdfLogoBase64` bilan bir xil qoida (PDF_LOGO_BRAND ustuvor).
 */
export function resolveBrandName(): string {
	const p = process.env.PDF_LOGO_BRAND?.trim().toLowerCase()
	if (p === 'jas' || p === 'kas') {
		return p === 'kas' ? 'KAS' : 'JAS'
	}
	return process.env.APP?.trim().toLowerCase() === 'jas' ? 'JAS' : 'KAS'
}
