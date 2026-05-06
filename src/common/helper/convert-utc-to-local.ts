export function convertUTCtoLocal(utcDate: Date): Date {
	return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate(), utcDate.getUTCHours() + 5, utcDate.getUTCMinutes(), utcDate.getUTCSeconds())
}

const MS_PER_HOUR = 60 * 60 * 1000

/**
 * Telegram caption, PDF va boshqa kanallarda ko‘rinadigan vaqt (+5 soat, O‘zbekiston).
 * Timestamp UTC deb qabul qilinadi; formatlash server timezone ga bog‘liq emas.
 */
export function formatDdMmYyyyHhMmForUzDisplay(date: Date, offsetHours = 5): string {
	const shifted = new Date(date.getTime() + offsetHours * MS_PER_HOUR)
	const dd = String(shifted.getUTCDate()).padStart(2, '0')
	const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0')
	const yyyy = shifted.getUTCFullYear()
	const hh = String(shifted.getUTCHours()).padStart(2, '0')
	const min = String(shifted.getUTCMinutes()).padStart(2, '0')
	return `${dd}.${mm}.${yyyy} ${hh}:${min}`
}
