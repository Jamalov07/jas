export function extractDateParts(
	date: Date,
	unit = 'second',
): Partial<{
	year: number
	month: number
	day: number
	hour: number
	minute: number
	second: number
}> {
	const parts = {
		year: date.getFullYear(),
		month: date.getMonth(),
		day: date.getDate(),
		hour: date.getHours(),
		minute: date.getMinutes(),
		second: date.getSeconds(),
	}

	const units = {
		year: ['year'],
		month: ['year', 'month'],
		day: ['year', 'month', 'day'],
		hour: ['year', 'month', 'day', 'hour'],
		minute: ['year', 'month', 'day', 'hour', 'minute'],
		second: ['year', 'month', 'day', 'hour', 'minute', 'second'],
	}

	const selectedParts = units[unit].reduce((acc, key) => {
		acc[key] = parts[key]
		return acc
	}, {})

	return selectedParts
}
