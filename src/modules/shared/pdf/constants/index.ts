import { jasLogoBase64 } from './jas-logo-base-64'
import { kasLogoBase64 } from './kas-logo-base-64'
export { jasInstagramQrCodeBase64 } from './jas-instagram-qr-code-base-64'
export { jasTelegramQrCodeBase64 } from './jas-telegram-qr-code-base-64'
import 'dotenv/config'

/**
 * PDF invoice logotipi.
 * 1) `PDF_LOGO_BRAND=jas` yoki `kas` (ustuvor)
 * 2) Aks holda legacy: `APP === 'jas'` bo‘lsa jas, boshqa hammasi kas (oldingi `index.ts` bilan bir xil)
 *
 * Docker: `docker-compose` `PDF_LOGO_BRAND` yoki `.env`.
 */
export function resolvePdfLogoBase64(): string {
	const p = process.env.PDF_LOGO_BRAND?.trim().toLowerCase()
	if (p === 'jas' || p === 'kas') {
		return p === 'kas' ? kasLogoBase64 : jasLogoBase64
	}
	return process.env.APP === 'jas' ? jasLogoBase64 : kasLogoBase64
}

export function resolveBrandName(): string {
	return process.env.APP === 'jas' ? 'JAS' : 'KAS'
}
