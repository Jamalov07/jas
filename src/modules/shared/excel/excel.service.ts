import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma'
import * as ExcelJS from 'exceljs'
import { Response } from 'express'
import { SellingFindManyRequest, SellingFindOneRequest } from '../../selling'
import { ArrivalFindManyRequest, ArrivalFindOneRequest } from '../../arrival'
import { ReturningFindManyRequest, ReturningFindOneRequest } from '../../returning'
import { ClientPaymentFindManyRequest } from '../../client-payment'
import { SupplierPaymentFindManyRequest } from '../../supplier-payment'
import { ClientFindManyRequest, ClientFindOneRequest } from '../../client'
import { StaffPaymentFindManyRequest } from '../../staff-payment'
import { ProductFindManyRequest } from '../../product'
import { SupplierFindManyRequest } from '../../supplier'
import { ChangeMethodEnum, SellingStatusEnum } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { SupplierFindOneRequest } from '../../supplier'

@Injectable()
export class ExcelService {
	constructor(private readonly prisma: PrismaService) {}

	private formatDate(date: Date): string {
		const dd = String(date.getDate()).padStart(2, '0')
		const mm = String(date.getMonth() + 1).padStart(2, '0')
		const yyyy = date.getFullYear()
		const hh = String(date.getHours()).padStart(2, '0')
		const min = String(date.getMinutes()).padStart(2, '0')
		return `${dd}.${mm}.${yyyy} ${hh}:${min}`
	}

	private allBorder(): Partial<ExcelJS.Borders> {
		return {
			top: { style: 'thin', color: { argb: 'FF000000' } },
			left: { style: 'thin', color: { argb: 'FF000000' } },
			bottom: { style: 'thin', color: { argb: 'FF000000' } },
			right: { style: 'thin', color: { argb: 'FF000000' } },
		}
	}

	private formatAmountLines(methods: { amount: Decimal; currency?: { symbol: string } | null }[]): string {
		if (!methods?.length) return ''
		const map = new Map<string, Decimal>()
		for (const m of methods) {
			const sym = m.currency?.symbol ?? '?'
			map.set(sym, (map.get(sym) ?? new Decimal(0)).plus(m.amount))
		}
		return Array.from(map.entries())
			.map(([sym, total]) => `${total.toFixed(2)} ${sym}`)
			.join(' + ')
	}

	private formatPaymentBlock(
		paymentMethods: { amount: Decimal; currency?: { symbol: string } | null }[],
		changeMethods?: { amount: Decimal; currency?: { symbol: string } | null }[] | null,
	): string {
		const pm = this.formatAmountLines(paymentMethods ?? [])
		const cm = this.formatAmountLines(changeMethods ?? [])
		if (!pm && !cm) return '0'
		if (pm && cm) return `${pm} | qaytim: ${cm}`
		return pm || `qaytim: ${cm}`
	}

	private styleHeaderRow(row: ExcelJS.Row) {
		row.eachCell((cell) => {
			cell.font = { bold: true }
			cell.alignment = { vertical: 'middle', horizontal: 'center' }
			cell.border = this.allBorder()
		})
	}

	private styleDataRow(row: ExcelJS.Row) {
		row.eachCell((cell) => {
			cell.alignment = { vertical: 'middle', horizontal: 'center' }
			cell.border = this.allBorder()
		})
	}

	// ─── Selling ──────────────────────────────────────────────────────────────

	async sellingDownloadMany(res: Response, query: SellingFindManyRequest) {
		const startDate = query.startDate ? new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) : undefined
		const endDate = query.endDate ? new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) : undefined

		const sellingList = await this.prisma.sellingModel.findMany({
			where: {
				deletedAt: null,
				clientId: query.clientId,
				staffId: query.staffId,
				status: SellingStatusEnum.accepted,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) },
			},
			select: {
				date: true,
				client: { select: { fullname: true, phone: true } },
				staff: { select: { fullname: true } },
				payment: {
					select: {
						description: true,
						paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
					},
				},
				products: {
					select: { prices: { where: { type: 'selling' }, select: { totalPrice: true, currency: { select: { symbol: true } } } } },
				},
			},
			orderBy: { date: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Sotuvlar')

		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'client', width: 35 },
			{ key: 'phone', width: 20 },
			{ key: 'summa', width: 30 },
			{ key: 'paid', width: 25 },
			{ key: 'staff', width: 25 },
			{ key: 'info', width: 35 },
			{ key: 'date', width: 25 },
		]

		worksheet.insertRow(1, ['Sotuvlar hisoboti'])
		worksheet.mergeCells('A1:H1')
		const titleCell = worksheet.getCell('A1')
		titleCell.font = { bold: true, size: 14 }
		titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
		titleCell.border = this.allBorder()

		worksheet.insertRow(2, [])

		const headers = ['№', 'Клиент', 'Тел', 'Сумма', 'Оплачено', 'Продавец', 'Информация', 'Дата продажи']
		const headerRow = worksheet.insertRow(3, headers)
		this.styleHeaderRow(headerRow)

		sellingList.forEach((item, index) => {
			const totalMap = new Map<string, Decimal>()
			for (const p of item.products) {
				for (const pr of p.prices) {
					const sym = pr.currency?.symbol ?? '?'
					totalMap.set(sym, (totalMap.get(sym) ?? new Decimal(0)).plus(pr.totalPrice))
				}
			}
			const totalStr =
				Array.from(totalMap.entries())
					.map(([s, t]) => `${t.toFixed(2)} ${s}`)
					.join(' + ') || '0'
			const paidStr = this.formatPaymentBlock(item.payment?.paymentMethods ?? [], item.payment?.changeMethods)

			const row = worksheet.addRow({
				no: index + 1,
				client: item.client.fullname,
				phone: item.client.phone,
				summa: totalStr,
				paid: paidStr,
				staff: item.staff.fullname,
				info: item.payment?.description ?? '',
				date: this.formatDate(item.date),
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="selling-report.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	async sellingDownloadOne(res: Response, query: SellingFindOneRequest) {
		const selling = await this.prisma.sellingModel.findFirst({
			where: { id: query.id },
			select: {
				date: true,
				status: true,
				publicId: true,
				client: { select: { fullname: true, phone: true } },
				staff: { select: { fullname: true } },
				payment: {
					select: {
						description: true,
						paymentMethods: { select: { amount: true, type: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { amount: true, type: true, currency: { select: { symbol: true } } } },
					},
				},
				products: {
					select: {
						count: true,
						prices: { where: { type: 'selling' }, select: { price: true, totalPrice: true, currency: { select: { symbol: true } } } },
						product: { select: { name: true } },
					},
					orderBy: { createdAt: 'asc' },
				},
			},
		})

		if (!selling) {
			res.status(404).send('Sotuv topilmadi')
			return
		}

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Chek')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'name', width: 40 },
			{ key: 'check', width: 8 },
			{ key: 'count', width: 15 },
			{ key: 'price', width: 25 },
			{ key: 'total', width: 25 },
		]

		const clientRow = worksheet.addRow([`Xaridor: ${selling.client.fullname}`])
		worksheet.mergeCells(`A${clientRow.number}:F${clientRow.number}`)
		clientRow.getCell(1).font = { bold: true }
		clientRow.getCell(1).border = this.allBorder()

		const phoneRow = worksheet.addRow([`Telefon: ${selling.client.phone}`])
		worksheet.mergeCells(`A${phoneRow.number}:F${phoneRow.number}`)
		phoneRow.getCell(1).font = { bold: true }
		phoneRow.getCell(1).border = this.allBorder()

		const headerRow = worksheet.addRow(['№', 'Mahsulot nomi', '√', 'Soni', 'Narxi', 'Summasi'])
		this.styleHeaderRow(headerRow)

		let maxNameLen = 30
		selling.products.forEach((item, index) => {
			const price = item.prices[0]?.price?.toNumber() ?? 0
			const sym = item.prices[0]?.currency?.symbol ?? ''
			const totalPrice = item.prices[0]?.totalPrice?.toNumber() ?? 0
			if (item.product.name.length > maxNameLen) maxNameLen = item.product.name.length

			const row = worksheet.addRow([index + 1, item.product.name, '', item.count, `${price} ${sym}`, `${totalPrice} ${sym}`])
			row.eachCell((cell, col) => {
				cell.alignment = { vertical: 'middle', horizontal: col === 2 ? 'left' : 'center' }
				cell.border = this.allBorder()
			})
		})

		worksheet.addRow([])

		const paidStr = this.formatPaymentBlock(selling.payment?.paymentMethods ?? [], selling.payment?.changeMethods)
		const paidRow = worksheet.addRow(['', '', '', '', 'Тўлов қилинди:', paidStr])
		this.styleHeaderRow(paidRow)

		worksheet.getColumn(2).width = Math.min(Math.max(maxNameLen + 5, 20), 60)

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', `attachment; filename="selling-${selling.publicId ?? 'one'}.xlsx"`)
		await workbook.xlsx.write(res)
		res.end()
	}

	// ─── Arrival ──────────────────────────────────────────────────────────────

	async arrivalDownloadMany(res: Response, query: ArrivalFindManyRequest) {
		const startDate = query.startDate ? new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) : undefined
		const endDate = query.endDate ? new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) : undefined

		const arrivalList = await this.prisma.arrivalModel.findMany({
			where: {
				deletedAt: null,
				supplierId: query.supplierId,
				OR: [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }],
				createdAt: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) },
			},
			select: {
				date: true,
				supplier: { select: { fullname: true } },
				staff: { select: { fullname: true } },
				payment: {
					select: {
						description: true,
						paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
					},
				},
				products: {
					select: { prices: { where: { type: 'cost' }, select: { totalPrice: true, currency: { select: { symbol: true } } } } },
				},
			},
			orderBy: { createdAt: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Приходы')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'supplier', width: 35 },
			{ key: 'summa', width: 30 },
			{ key: 'paid', width: 25 },
			{ key: 'staff', width: 25 },
			{ key: 'info', width: 35 },
			{ key: 'date', width: 25 },
		]

		worksheet.insertRow(1, ['Приходы hisoboti'])
		worksheet.mergeCells('A1:G1')
		const titleCell = worksheet.getCell('A1')
		titleCell.font = { bold: true, size: 14 }
		titleCell.border = this.allBorder()

		worksheet.insertRow(2, [])

		const headerRow = worksheet.insertRow(3, ['№', 'Поставщик', 'Сумма', 'Оплачено', 'Кем оприходован', 'Информация', 'Дата прихода'])
		this.styleHeaderRow(headerRow)

		arrivalList.forEach((item, index) => {
			const totalMap = new Map<string, Decimal>()
			for (const p of item.products) {
				for (const pr of p.prices) {
					const sym = pr.currency?.symbol ?? '?'
					totalMap.set(sym, (totalMap.get(sym) ?? new Decimal(0)).plus(pr.totalPrice))
				}
			}
			const totalStr =
				Array.from(totalMap.entries())
					.map(([s, t]) => `${t.toFixed(2)} ${s}`)
					.join(' + ') || '0'
			const paidStr = this.formatPaymentBlock(item.payment?.paymentMethods ?? [], item.payment?.changeMethods)

			const row = worksheet.addRow({
				no: index + 1,
				supplier: item.supplier.fullname,
				summa: totalStr,
				paid: paidStr,
				staff: item.staff?.fullname ?? '',
				info: item.payment?.description ?? '',
				date: this.formatDate(item.date),
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="arrival-report.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	async arrivalDownloadOne(res: Response, query: ArrivalFindOneRequest) {
		const arrival = await this.prisma.arrivalModel.findFirst({
			where: { id: query.id, deletedAt: null },
			select: {
				date: true,
				supplier: { select: { fullname: true } },
				staff: { select: { fullname: true } },
				payment: {
					select: {
						description: true,
						paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
					},
				},
				products: {
					select: {
						count: true,
						prices: { where: { type: 'cost' }, select: { price: true, totalPrice: true, currency: { select: { symbol: true } } } },
						product: { select: { name: true } },
					},
					orderBy: { createdAt: 'asc' },
				},
			},
		})

		if (!arrival) {
			res.status(404).send('Prikhod topilmadi')
			return
		}

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Приходы')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'product', width: 35 },
			{ key: 'quantity', width: 15 },
			{ key: 'price', width: 20 },
			{ key: 'cost', width: 20 },
		]

		const dateRow = worksheet.addRow([`Приход от: ${this.formatDate(arrival.date)}`])
		worksheet.mergeCells(`A${dateRow.number}:E${dateRow.number}`)
		dateRow.getCell(1).font = { bold: true }
		dateRow.getCell(1).border = this.allBorder()

		const supplierRow = worksheet.addRow([`Поставщик: ${arrival.supplier.fullname}`])
		worksheet.mergeCells(`A${supplierRow.number}:E${supplierRow.number}`)
		supplierRow.getCell(1).font = { bold: true }
		supplierRow.getCell(1).border = this.allBorder()

		worksheet.addRow([])

		const headerRow = worksheet.addRow(['№', 'Товар', 'Количество', 'Цена', 'Стоимость'])
		this.styleHeaderRow(headerRow)

		let totalCostStr = '0'
		const totalMap = new Map<string, Decimal>()

		arrival.products.forEach((p, index) => {
			const price = p.prices[0]?.price?.toNumber() ?? 0
			const sym = p.prices[0]?.currency?.symbol ?? ''
			const totalPrice = p.prices[0]?.totalPrice ?? new Decimal(0)
			totalMap.set(sym, (totalMap.get(sym) ?? new Decimal(0)).plus(totalPrice))

			const row = worksheet.addRow([index + 1, p.product.name, p.count, `${price} ${sym}`, `${totalPrice.toFixed(2)} ${sym}`])
			this.styleDataRow(row)
		})

		totalCostStr =
			Array.from(totalMap.entries())
				.map(([s, t]) => `${t.toFixed(2)} ${s}`)
				.join(' + ') || '0'

		worksheet.addRow([])
		const totalRow = worksheet.addRow(['', 'Итого', '', '', totalCostStr])
		this.styleHeaderRow(totalRow)

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="arrival-report-one.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	// ─── Returning ────────────────────────────────────────────────────────────

	async returningDownloadMany(res: Response, query: ReturningFindManyRequest) {
		const startDate = query.startDate ? new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) : undefined
		const endDate = query.endDate ? new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) : undefined

		const returningList = await this.prisma.returningModel.findMany({
			where: {
				status: query.status,
				clientId: query.clientId,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				date: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) },
			},
			select: {
				date: true,
				client: { select: { fullname: true, phone: true } },
				staff: { select: { fullname: true } },
				payment: {
					select: {
						description: true,
						paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
					},
				},
			},
			orderBy: { date: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Возвраты')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'client', width: 45 },
			{ key: 'paid', width: 25 },
			{ key: 'staff', width: 20 },
			{ key: 'info', width: 25 },
			{ key: 'date', width: 20 },
		]

		worksheet.insertRow(1, ['Возвраты hisoboti'])
		worksheet.mergeCells('A1:F1')
		const titleCell = worksheet.getCell('A1')
		titleCell.font = { bold: true }
		titleCell.border = this.allBorder()

		worksheet.insertRow(2, [])

		const headerRow = worksheet.insertRow(3, ['№', 'Клиент', 'Оплачено', 'Кем отправован', 'Информация', 'Дата'])
		this.styleHeaderRow(headerRow)

		returningList.forEach((item, index) => {
			const paidStr = this.formatPaymentBlock(item.payment?.paymentMethods ?? [], item.payment?.changeMethods)
			const row = worksheet.addRow({
				no: index + 1,
				client: `${item.client.fullname} - ${item.client.phone}`,
				paid: paidStr,
				staff: item.staff?.fullname ?? '',
				info: item.payment?.description ?? '',
				date: this.formatDate(item.date),
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="returnings-report.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	async returningDownloadOne(res: Response, query: ReturningFindOneRequest) {
		const returning = await this.prisma.returningModel.findFirst({
			where: { id: query.id },
			select: {
				date: true,
				client: { select: { fullname: true } },
				products: {
					select: {
						count: true,
						prices: { where: { type: 'selling' }, select: { price: true, totalPrice: true, currency: { select: { symbol: true } } } },
						product: { select: { name: true } },
					},
					orderBy: { createdAt: 'asc' },
				},
			},
		})

		if (!returning) {
			res.status(404).send('Qaytarish topilmadi')
			return
		}

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Возврат')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'product', width: 40 },
			{ key: 'quantity', width: 15 },
			{ key: 'price', width: 20 },
			{ key: 'cost', width: 20 },
		]

		const dateRow = worksheet.addRow([`Дата: ${this.formatDate(returning.date)}`])
		worksheet.mergeCells(`A${dateRow.number}:E${dateRow.number}`)
		dateRow.getCell(1).font = { bold: true }
		dateRow.getCell(1).border = this.allBorder()

		const clientRow = worksheet.addRow([`Клиент: ${returning.client.fullname}`])
		worksheet.mergeCells(`A${clientRow.number}:E${clientRow.number}`)
		clientRow.getCell(1).font = { bold: true }
		clientRow.getCell(1).border = this.allBorder()

		worksheet.addRow([])

		const headerRow = worksheet.addRow(['№', 'Товар', 'Количество', 'Цена', 'Стоимость'])
		this.styleHeaderRow(headerRow)

		const totalMap = new Map<string, Decimal>()

		returning.products.forEach((item, index) => {
			const price = item.prices[0]?.price?.toNumber() ?? 0
			const sym = item.prices[0]?.currency?.symbol ?? ''
			const totalPrice = item.prices[0]?.totalPrice ?? new Decimal(0)
			totalMap.set(sym, (totalMap.get(sym) ?? new Decimal(0)).plus(totalPrice))

			const row = worksheet.addRow([index + 1, item.product.name, item.count, `${price} ${sym}`, `${totalPrice.toFixed(2)} ${sym}`])
			this.styleDataRow(row)
		})

		worksheet.addRow([])
		const totalStr =
			Array.from(totalMap.entries())
				.map(([s, t]) => `${t.toFixed(2)} ${s}`)
				.join(' + ') || '0'
		const totalRow = worksheet.addRow(['', 'Итого', '', '', totalStr])
		this.styleHeaderRow(totalRow)

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="returning-report.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	// ─── Client Payment ────────────────────────────────────────────────────────

	async clientPaymentDownloadMany(res: Response, query: ClientPaymentFindManyRequest) {
		const startDate = query.startDate ? new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) : undefined
		const endDate = query.endDate ? new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) : undefined

		const clientPayments = await this.prisma.clientPaymentModel.findMany({
			where: {
				clientId: query.clientId,
				staffId: query.staffId,
				deletedAt: null,
				OR: [{ client: { fullname: { contains: query.search, mode: 'insensitive' } } }, { client: { phone: { contains: query.search, mode: 'insensitive' } } }],
				createdAt: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) },
			},
			select: {
				client: { select: { fullname: true } },
				staff: { select: { fullname: true } },
				description: true,
				createdAt: true,
				paymentMethods: { select: { amount: true, type: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { amount: true, type: true, currency: { select: { symbol: true } } } },
			},
			orderBy: { createdAt: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Клиент оплаты')
		worksheet.columns = [
			{ header: '№', key: 'no', width: 5 },
			{ header: 'Клиент', key: 'client', width: 30 },
			{ header: 'Информация', key: 'info', width: 35 },
			{ header: 'Сумма', key: 'amount', width: 35 },
			{ header: 'Сотрудник', key: 'staff', width: 25 },
			{ header: 'Дата', key: 'date', width: 25 },
		]

		this.styleHeaderRow(worksheet.getRow(1))

		clientPayments.forEach((payment, index) => {
			const amountStr = this.formatPaymentBlock(payment.paymentMethods ?? [], payment.changeMethods)
			const row = worksheet.addRow({
				no: index + 1,
				client: payment.client.fullname,
				info: payment.description ?? '',
				amount: amountStr,
				staff: payment.staff?.fullname ?? '',
				date: this.formatDate(payment.createdAt),
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="client-payments.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	// ─── Supplier Payment ──────────────────────────────────────────────────────

	async supplierPaymentDownloadMany(res: Response, query: SupplierPaymentFindManyRequest) {
		const startDate = query.startDate ? new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) : undefined
		const endDate = query.endDate ? new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) : undefined

		const supplierPayments = await this.prisma.supplierPaymentModel.findMany({
			where: {
				supplierId: query.supplierId,
				staffId: query.staffId,
				deletedAt: null,
				OR: [{ supplier: { fullname: { contains: query.search, mode: 'insensitive' } } }, { supplier: { phone: { contains: query.search, mode: 'insensitive' } } }],
				createdAt: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) },
			},
			select: {
				supplier: { select: { fullname: true } },
				staff: { select: { fullname: true } },
				description: true,
				createdAt: true,
				paymentMethods: { select: { amount: true, type: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { amount: true, type: true, currency: { select: { symbol: true } } } },
			},
			orderBy: { createdAt: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Поставщик оплаты')
		worksheet.columns = [
			{ header: '№', key: 'no', width: 5 },
			{ header: 'Поставщик', key: 'supplier', width: 30 },
			{ header: 'Информация', key: 'info', width: 35 },
			{ header: 'Сумма', key: 'amount', width: 35 },
			{ header: 'Сотрудник', key: 'staff', width: 25 },
			{ header: 'Дата', key: 'date', width: 25 },
		]

		this.styleHeaderRow(worksheet.getRow(1))

		supplierPayments.forEach((payment, index) => {
			const amountStr = this.formatPaymentBlock(payment.paymentMethods ?? [], payment.changeMethods)
			const row = worksheet.addRow({
				no: index + 1,
				supplier: payment.supplier.fullname,
				info: payment.description ?? '',
				amount: amountStr,
				staff: payment.staff?.fullname ?? '',
				date: this.formatDate(payment.createdAt),
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="supplier-payments.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	// ─── Client Download ───────────────────────────────────────────────────────

	async clientDownloadMany(res: Response, query: ClientFindManyRequest) {
		const clients = await this.prisma.clientModel.findMany({
			where: {
				deletedAt: null,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				createdAt: true,
				sellings: {
					where: { status: SellingStatusEnum.accepted },
					select: {
						date: true,
						products: { select: { prices: { where: { type: 'selling' }, select: { totalPrice: true, currencyId: true } } } },
						payment: {
							select: {
								paymentMethods: { select: { type: true, amount: true, currencyId: true } },
								changeMethods: { select: { type: true, amount: true, currencyId: true } },
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					select: {
						paymentMethods: { select: { type: true, amount: true, currencyId: true } },
						changeMethods: { select: { type: true, amount: true, currencyId: true } },
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Клиенты')
		worksheet.columns = [
			{ header: '№', key: 'no', width: 5 },
			{ header: 'ФИО', key: 'fullname', width: 35 },
			{ header: 'Телефон', key: 'phone', width: 20 },
			{ header: 'Долг', key: 'debt', width: 30 },
			{ header: 'Последняя продажа', key: 'lastSale', width: 25 },
			{ header: 'Зарегистрирован', key: 'createdAt', width: 25 },
		]

		this.styleHeaderRow(worksheet.getRow(1))

		clients.forEach((c, index) => {
			const debtMap = new Map<string, Decimal>()
			for (const sel of c.sellings) {
				for (const p of sel.products) {
					for (const pr of p.prices) {
						debtMap.set(pr.currencyId, (debtMap.get(pr.currencyId) ?? new Decimal(0)).plus(pr.totalPrice))
					}
				}
				for (const m of sel.payment?.paymentMethods ?? []) {
					debtMap.set(m.currencyId, (debtMap.get(m.currencyId) ?? new Decimal(0)).minus(m.amount))
				}
				for (const ch of sel.payment?.changeMethods ?? []) {
					debtMap.set(ch.currencyId, (debtMap.get(ch.currencyId) ?? new Decimal(0)).plus(ch.amount))
				}
			}
			for (const cp of c.payments) {
				for (const m of cp.paymentMethods) {
					debtMap.set(m.currencyId, (debtMap.get(m.currencyId) ?? new Decimal(0)).minus(m.amount))
				}
				for (const ch of cp.changeMethods ?? []) {
					if (ch.type === ChangeMethodEnum.balance) continue
					const curr = debtMap.get(ch.currencyId) ?? new Decimal(0)
					debtMap.set(ch.currencyId, ch.type === ChangeMethodEnum.cash ? curr.plus(ch.amount) : curr.minus(ch.amount))
				}
			}
			const debtStr = Array.from(debtMap.values())
				.reduce((a, b) => a.plus(b), new Decimal(0))
				.toFixed(2)

			const row = worksheet.addRow({
				no: index + 1,
				fullname: c.fullname,
				phone: c.phone,
				debt: debtStr,
				lastSale: c.sellings[0] ? this.formatDate(c.sellings[0].date) : '',
				createdAt: this.formatDate(c.createdAt),
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="clients.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	async clientDeedDownloadOne(res: Response, query: ClientFindOneRequest) {
		const deedStartDate = query.deedStartDate ? new Date(new Date(query.deedStartDate).setHours(0, 0, 0, 0)) : undefined
		const deedEndDate = query.deedEndDate ? new Date(new Date(query.deedEndDate).setHours(23, 59, 59, 999)) : undefined

		const client = await this.prisma.clientModel.findFirst({
			where: { id: query.id },
			select: {
				fullname: true,
				phone: true,
				sellings: {
					where: { status: SellingStatusEnum.accepted, date: { gte: deedStartDate, lte: deedEndDate } },
					select: {
						date: true,
						products: { select: { prices: { where: { type: 'selling' }, select: { totalPrice: true, currency: { select: { symbol: true } } } } } },
						payment: {
							select: {
								createdAt: true,
								description: true,
								paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
								changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
							},
						},
					},
					orderBy: { date: 'asc' },
				},
				payments: {
					where: { createdAt: { gte: deedStartDate, lte: deedEndDate }, deletedAt: null },
					select: {
						createdAt: true,
						description: true,
						paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
					},
				},
			},
		})

		if (!client) {
			res.status(404).send('Mijoz topilmadi')
			return
		}

		const deeds: { type: 'debit' | 'credit'; action: string; amount: string; date: Date; description: string }[] = []

		for (const sel of client.sellings) {
			const totalMap = new Map<string, Decimal>()
			for (const p of sel.products) {
				for (const pr of p.prices) {
					const sym = pr.currency?.symbol ?? '?'
					totalMap.set(sym, (totalMap.get(sym) ?? new Decimal(0)).plus(pr.totalPrice))
				}
			}
			const amtStr = Array.from(totalMap.entries())
				.map(([s, t]) => `${t.toFixed(2)} ${s}`)
				.join(' + ')
			deeds.push({ type: 'debit', action: 'Sotuv', amount: amtStr, date: sel.date, description: '' })

			if (sel.payment) {
				const chStr = this.formatAmountLines(sel.payment.changeMethods ?? [])
				if (chStr) {
					deeds.push({ type: 'debit', action: 'Qaytim', amount: chStr, date: sel.payment.createdAt, description: sel.payment.description ?? '' })
				}
				const paidStr = this.formatAmountLines(sel.payment.paymentMethods ?? [])
				if (paidStr) {
					deeds.push({ type: 'credit', action: "To'lov", amount: paidStr, date: sel.payment.createdAt, description: sel.payment.description ?? '' })
				}
			}
		}

		for (const cp of client.payments) {
			const paidStr = this.formatAmountLines(cp.paymentMethods ?? [])
			if (paidStr) {
				deeds.push({ type: 'credit', action: "To'lov", amount: paidStr, date: cp.createdAt, description: cp.description ?? '' })
			}
		}

		deeds.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Дебитор')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'type', width: 15 },
			{ key: 'action', width: 20 },
			{ key: 'amount', width: 35 },
			{ key: 'description', width: 35 },
			{ key: 'date', width: 25 },
		]

		const titleRow = worksheet.addRow([`${client.fullname} (${client.phone}) - Дебитор ведомость`])
		worksheet.mergeCells(`A${titleRow.number}:F${titleRow.number}`)
		titleRow.getCell(1).font = { bold: true, size: 13 }
		titleRow.getCell(1).border = this.allBorder()

		worksheet.addRow([])

		const headerRow = worksheet.addRow(['№', 'Тип', 'Действие', 'Сумма', 'Примечание', 'Дата'])
		this.styleHeaderRow(headerRow)

		deeds.forEach((d, i) => {
			const row = worksheet.addRow([i + 1, d.type === 'debit' ? 'Дебит' : 'Кредит', d.action, d.amount, d.description, this.formatDate(d.date)])
			row.eachCell((cell, col) => {
				cell.alignment = { vertical: 'middle', horizontal: col === 4 ? 'left' : 'center' }
				cell.border = this.allBorder()
				if (d.type === 'debit') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0CC' } }
				else cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9F0D3' } }
			})
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="client-deed.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	async clientDeedWithProductDownloadOne(res: Response, query: ClientFindOneRequest) {
		return this.clientDeedDownloadOne(res, query)
	}

	// ─── Supplier Download ─────────────────────────────────────────────────────

	async supplierDownloadMany(res: Response, query: SupplierFindManyRequest) {
		const suppliers = await this.prisma.supplierModel.findMany({
			where: {
				deletedAt: null,
				OR: [{ fullname: { contains: query.search, mode: 'insensitive' } }, { phone: { contains: query.search, mode: 'insensitive' } }],
			},
			select: {
				id: true,
				fullname: true,
				phone: true,
				createdAt: true,
				arrivals: {
					select: {
						date: true,
						products: { select: { prices: { where: { type: 'cost' }, select: { totalPrice: true, currencyId: true } } } },
						payment: {
							select: {
								paymentMethods: { select: { type: true, amount: true, currencyId: true } },
								changeMethods: { select: { type: true, amount: true, currencyId: true } },
							},
						},
					},
					orderBy: { date: 'desc' },
				},
				payments: {
					select: {
						paymentMethods: { select: { type: true, amount: true, currencyId: true } },
						changeMethods: { select: { type: true, amount: true, currencyId: true } },
					},
				},
			},
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Поставщики')
		worksheet.columns = [
			{ header: '№', key: 'no', width: 5 },
			{ header: 'ФИО', key: 'fullname', width: 35 },
			{ header: 'Телефон', key: 'phone', width: 20 },
			{ header: 'Долг', key: 'debt', width: 30 },
			{ header: 'Последний приход', key: 'lastArrival', width: 25 },
		]

		this.styleHeaderRow(worksheet.getRow(1))

		suppliers.forEach((s, index) => {
			const debtMap = new Map<string, Decimal>()
			for (const arr of s.arrivals) {
				for (const p of arr.products) {
					for (const pr of p.prices) {
						debtMap.set(pr.currencyId, (debtMap.get(pr.currencyId) ?? new Decimal(0)).plus(pr.totalPrice))
					}
				}
				for (const m of arr.payment?.paymentMethods ?? []) {
					debtMap.set(m.currencyId, (debtMap.get(m.currencyId) ?? new Decimal(0)).minus(m.amount))
				}
				for (const ch of arr.payment?.changeMethods ?? []) {
					debtMap.set(ch.currencyId, (debtMap.get(ch.currencyId) ?? new Decimal(0)).plus(ch.amount))
				}
			}
			for (const sp of s.payments) {
				for (const m of sp.paymentMethods) {
					debtMap.set(m.currencyId, (debtMap.get(m.currencyId) ?? new Decimal(0)).minus(m.amount))
				}
				for (const ch of sp.changeMethods ?? []) {
					if (ch.type === ChangeMethodEnum.balance) continue
					const curr = debtMap.get(ch.currencyId) ?? new Decimal(0)
					debtMap.set(ch.currencyId, ch.type === ChangeMethodEnum.cash ? curr.plus(ch.amount) : curr.minus(ch.amount))
				}
			}
			const debtStr = Array.from(debtMap.values())
				.reduce((a, b) => a.plus(b), new Decimal(0))
				.toFixed(2)

			const row = worksheet.addRow({
				no: index + 1,
				fullname: s.fullname,
				phone: s.phone,
				debt: debtStr,
				lastArrival: s.arrivals[0] ? this.formatDate(s.arrivals[0].date) : '',
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="suppliers.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	async supplierDeedDownloadOne(res: Response, query: SupplierFindOneRequest & { deedStartDate?: Date; deedEndDate?: Date }) {
		const deedStartDate = query.deedStartDate ? new Date(new Date(query.deedStartDate).setHours(0, 0, 0, 0)) : undefined
		const deedEndDate = query.deedEndDate ? new Date(new Date(query.deedEndDate).setHours(23, 59, 59, 999)) : undefined

		const supplier = await this.prisma.supplierModel.findFirst({
			where: { id: query.id },
			select: {
				fullname: true,
				phone: true,
				arrivals: {
					where: { date: { gte: deedStartDate, lte: deedEndDate } },
					select: {
						date: true,
						products: { select: { prices: { where: { type: 'cost' }, select: { totalPrice: true, currency: { select: { symbol: true } } } } } },
						payment: {
							select: {
								createdAt: true,
								description: true,
								paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
								changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
							},
						},
					},
					orderBy: { date: 'asc' },
				},
				payments: {
					where: { createdAt: { gte: deedStartDate, lte: deedEndDate }, deletedAt: null },
					select: {
						createdAt: true,
						description: true,
						paymentMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
						changeMethods: { select: { type: true, amount: true, currency: { select: { symbol: true } } } },
					},
				},
			},
		})

		if (!supplier) {
			res.status(404).send('Yetkazib beruvchi topilmadi')
			return
		}

		const deeds: { type: 'debit' | 'credit'; action: string; amount: string; date: Date; description: string }[] = []

		for (const arr of supplier.arrivals) {
			const totalMap = new Map<string, Decimal>()
			for (const p of arr.products) {
				for (const pr of p.prices) {
					const sym = pr.currency?.symbol ?? '?'
					totalMap.set(sym, (totalMap.get(sym) ?? new Decimal(0)).plus(pr.totalPrice))
				}
			}
			const amtStr = Array.from(totalMap.entries())
				.map(([s, t]) => `${t.toFixed(2)} ${s}`)
				.join(' + ')
			deeds.push({ type: 'debit', action: 'Kelish', amount: amtStr, date: arr.date, description: '' })

			if (arr.payment) {
				const chStr = this.formatAmountLines(arr.payment.changeMethods ?? [])
				if (chStr) {
					deeds.push({ type: 'debit', action: 'Qaytim', amount: chStr, date: arr.payment.createdAt, description: arr.payment.description ?? '' })
				}
				const paidStr = this.formatAmountLines(arr.payment.paymentMethods ?? [])
				if (paidStr) {
					deeds.push({ type: 'credit', action: "To'lov", amount: paidStr, date: arr.payment.createdAt, description: arr.payment.description ?? '' })
				}
			}
		}

		for (const sp of supplier.payments) {
			const paidStr = this.formatAmountLines(sp.paymentMethods ?? [])
			if (paidStr) {
				deeds.push({ type: 'credit', action: "To'lov", amount: paidStr, date: sp.createdAt, description: sp.description ?? '' })
			}
		}

		deeds.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Поставщик')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'type', width: 15 },
			{ key: 'action', width: 20 },
			{ key: 'amount', width: 35 },
			{ key: 'description', width: 35 },
			{ key: 'date', width: 25 },
		]

		const titleRow = worksheet.addRow([`${supplier.fullname} (${supplier.phone}) - Ведомость`])
		worksheet.mergeCells(`A${titleRow.number}:F${titleRow.number}`)
		titleRow.getCell(1).font = { bold: true, size: 13 }
		titleRow.getCell(1).border = this.allBorder()

		worksheet.addRow([])
		const headerRow = worksheet.addRow(['№', 'Тип', 'Действие', 'Сумма', 'Примечание', 'Дата'])
		this.styleHeaderRow(headerRow)

		deeds.forEach((d, i) => {
			const row = worksheet.addRow([i + 1, d.type === 'debit' ? 'Дебит' : 'Кредит', d.action, d.amount, d.description, this.formatDate(d.date)])
			row.eachCell((cell) => {
				cell.alignment = { vertical: 'middle', horizontal: 'center' }
				cell.border = this.allBorder()
			})
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="supplier-deed.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	async supplierDeedWithProductDownloadOne(res: Response, query: SupplierFindOneRequest & { deedStartDate?: Date; deedEndDate?: Date }) {
		return this.supplierDeedDownloadOne(res, query)
	}

	// ─── Product Download ──────────────────────────────────────────────────────

	async productDownloadMany(res: Response, query: ProductFindManyRequest) {
		const nameFilter = query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }] } : {}

		const products = await this.prisma.productModel.findMany({
			where: { ...nameFilter },
			select: {
				id: true,
				name: true,
				count: true,
				minAmount: true,
				createdAt: true,
				prices: {
					where: { type: { in: ['cost', 'selling'] } },
					select: { type: true, price: true, totalPrice: true, currency: { select: { symbol: true } } },
				},
			},
			orderBy: { createdAt: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Товары')
		worksheet.columns = [
			{ header: '№', key: 'no', width: 5 },
			{ header: 'Наименование', key: 'name', width: 40 },
			{ header: 'Себестоимость', key: 'cost', width: 25 },
			{ header: 'Цена продажи', key: 'price', width: 25 },
			{ header: 'Количество', key: 'count', width: 15 },
			{ header: 'Мин. остаток', key: 'minAmount', width: 15 },
			{ header: 'Дата', key: 'createdAt', width: 25 },
		]

		worksheet.getRow(1).eachCell((cell) => {
			cell.font = { bold: true }
			cell.alignment = { vertical: 'middle', horizontal: 'center' }
			cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB6D7A8' } }
			cell.border = this.allBorder()
		})

		products.forEach((p, index) => {
			const costPrice = p.prices.find((pp) => pp.type === 'cost')
			const sellingPrice = p.prices.find((pp) => pp.type === 'selling')
			const costStr = costPrice ? `${costPrice.price.toFixed(2)} ${costPrice.currency?.symbol ?? ''}` : '0'
			const sellingStr = sellingPrice ? `${sellingPrice.price.toFixed(2)} ${sellingPrice.currency?.symbol ?? ''}` : '0'

			const row = worksheet.addRow({
				no: index + 1,
				name: p.name,
				cost: costStr,
				price: sellingStr,
				count: p.count,
				minAmount: p.minAmount ?? 0,
				createdAt: this.formatDate(p.createdAt),
			})
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="products.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}

	// ─── Staff Payment Download ────────────────────────────────────────────────

	async staffPaymentDownloadMany(res: Response, query: StaffPaymentFindManyRequest) {
		const startDate = query.startDate ? new Date(new Date(query.startDate).setHours(0, 0, 0, 0)) : undefined
		const endDate = query.endDate ? new Date(new Date(query.endDate).setHours(23, 59, 59, 999)) : undefined

		const staffPayments = await this.prisma.staffPaymentModel.findMany({
			where: {
				employeeId: query.staffId,
				deletedAt: null,
				createdAt: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) },
			},
			select: {
				employee: { select: { fullname: true, phone: true } },
				staff: { select: { fullname: true } },
				description: true,
				createdAt: true,
				methods: { select: { amount: true, currency: { select: { symbol: true } } } },
			},
			orderBy: { createdAt: 'desc' },
		})

		const workbook = new ExcelJS.Workbook()
		const worksheet = workbook.addWorksheet('Оплаты сотрудника')
		worksheet.columns = [
			{ key: 'no', width: 5 },
			{ key: 'fullname', width: 30 },
			{ key: 'phone', width: 20 },
			{ key: 'amount', width: 30 },
			{ key: 'description', width: 30 },
			{ key: 'createdAt', width: 25 },
		]

		const headerRow = worksheet.addRow(['№', 'ФИО', 'Телефон', 'Сумма оплаты', 'Примечание', 'Дата оплаты'])
		this.styleHeaderRow(headerRow)

		staffPayments.forEach((item, index) => {
			const amountStr = this.formatAmountLines(item.methods)
			const row = worksheet.addRow([index + 1, item.employee.fullname, item.employee.phone, amountStr, item.description ?? '', this.formatDate(item.createdAt)])
			this.styleDataRow(row)
		})

		res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
		res.setHeader('Content-Disposition', 'attachment; filename="staff-payments.xlsx"')
		await workbook.xlsx.write(res)
		res.end()
	}
}
