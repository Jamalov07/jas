// helpers/excel-reader.ts
import * as XLSX from 'xlsx'

export function readExcel(buffer: Buffer): any[] {
	const workbook = XLSX.read(buffer, { type: 'buffer' })
	const sheetName = workbook.SheetNames[0]
	const sheet = workbook.Sheets[sheetName]

	// header: 1-qatorni key qiladi
	return XLSX.utils.sheet_to_json(sheet, {
		defval: null,
		raw: false,
		dateNF: 'yyyy-mm-dd HH:mm:ss',
	})
}

export function readExcel2(buffer: Buffer) {
	const workbook = XLSX.read(buffer, { type: 'buffer' })
	const sheet = workbook.Sheets[workbook.SheetNames[0]]

	return XLSX.utils.sheet_to_json(sheet, {
		defval: null,
	})
}
