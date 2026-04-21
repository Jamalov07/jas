import { Injectable } from '@nestjs/common'
import { UploadQueryDto } from './dtos/request.dto'
import { Express } from 'express'
import { readExcel2 } from './helpers'
import { UploadModeEnum } from './enums'
import { PrismaService } from '../shared'
import { Decimal } from '@prisma/client/runtime/library'
import { Multer } from 'multer'
import * as XLSX from 'xlsx'
import { PriceTypeEnum } from '@prisma/client'

@Injectable()
export class UploadService {
	constructor(private readonly prisma: PrismaService) {}

	async uploadSupplier(file: Express.Multer.File, query: UploadQueryDto) {
		const workbook = XLSX.read(file.buffer, { type: 'buffer' })
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		// Massiv ko'rinishida o'qiymiz (indekslar bilan ishlash uchun)
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

		const prisma = this.prisma

		// --- OVERWRITE MODE ---
		if (query.mode === UploadModeEnum.OVERWRITE) {
			await prisma.$transaction([prisma.supplierPaymentModel.deleteMany({}), prisma.arrivalModel.deleteMany({}), prisma.supplierModel.deleteMany({})])
		}

		// --- HELPERS ---
		const parseNum = (val: any) => {
			if (val === null || val === undefined) return 0
			const cleaned = String(val).replace(/\s/g, '').replace(',', '.')
			return isNaN(parseFloat(cleaned)) ? 0 : parseFloat(cleaned)
		}

		const normalizePhone = (phoneRaw: string | null) => {
			if (!phoneRaw) return null
			const digits = String(phoneRaw).replace(/\D/g, '')
			if (!digits) return null
			if (digits.length === 9) return '+998' + digits
			if (digits.startsWith('998') && digits.length === 12) return '+' + digits
			return '+' + digits
		}

		const getOrCreateCurrency = async (symbol: string) => {
			const cleanSymbol = symbol.trim().toUpperCase()
			let currency = await prisma.currencyModel.findFirst({ where: { symbol: cleanSymbol } })
			if (!currency) {
				currency = await prisma.currencyModel.create({
					data: { symbol: cleanSymbol, name: cleanSymbol, exchangeRate: 1 },
				})
			}
			return currency
		}

		// Staff (Admin/Staff)
		const staff = (await prisma.staffModel.findFirst({ where: { type: 'admin' } })) || (await prisma.staffModel.findFirst({ where: { type: 'staff' } }))
		if (!staff) throw new Error("Mas'ul xodim (staff) topilmadi")

		// Import uchun virtual mahsulot
		let product = await prisma.productModel.findFirst({ where: { name: '__IMPORT_PRODUCT__' } })
		if (!product) {
			product = await prisma.productModel.create({ data: { name: '__IMPORT_PRODUCT__', deletedAt: new Date() } })
		}

		// Valyutalarni oldindan tayyorlaymiz
		const usdCurrency = await getOrCreateCurrency('USD')
		const uzsCurrency = await getOrCreateCurrency('UZS')

		let createdSuppliers = 0,
			createdArrivals = 0,
			createdPayments = 0

		// --- PROCESS ROWS ---
		// Rasmda sarlavhalar 3-qatorda, ma'lumot 4-qatordan boshlanishi mumkin (i = 3)
		for (let i = 3; i < rows.length; i++) {
			const row = rows[i]
			if (!row || row.length === 0 || !row[1]) continue

			const fullname = String(row[1] || '').trim()
			if (fullname.toLowerCase().includes('итого') || fullname.toLowerCase().includes('сумма')) continue

			const phone = normalizePhone(row[12]) // M ustuni - Kontaktlar
			const uzsBalance = parseNum(row[3]) // D ustuni - UZS
			const usdBalance = parseNum(row[4]) // E ustuni - USD

			// 1. Supplierni topamiz yoki yaratamiz
			let supplier = null
			if (phone) {
				supplier = await prisma.supplierModel.findFirst({ where: { phone } })
			}

			if (!supplier) {
				supplier = await prisma.supplierModel.create({
					data: { fullname, phone: phone || undefined },
				})
				createdSuppliers++
			}

			// Balansni hisoblash (Supplierlar uchun: minus (-) - bu bizga yuk kelgan, plus (+) - biz to'laganmiz)
			const transactions = [
				{ curr: uzsCurrency, amount: uzsBalance },
				{ curr: usdCurrency, amount: usdBalance },
			]

			for (const trans of transactions) {
				if (trans.amount === 0) continue

				if (trans.amount < 0) {
					// Minus bo'lsa - Arrival (Kirim) yaratamiz
					await prisma.arrivalModel.create({
						data: {
							supplierId: supplier.id,
							staffId: staff.id,
							products: {
								create: [
									{
										count: 1,
										staffId: staff.id,
										productId: product.id,
										prices: {
											create: [
												{
													type: 'cost',
													price: new Decimal(Math.abs(trans.amount)),
													totalPrice: new Decimal(Math.abs(trans.amount)),
													currencyId: trans.curr.id,
												},
											],
										},
									},
								],
							},
						},
					})
					createdArrivals++
				} else {
					// Plus bo'lsa - Payment (To'lov) yaratamiz
					await prisma.supplierPaymentModel.create({
						data: {
							supplierId: supplier.id,
							staffId: staff.id,
							paymentMethods: {
								create: [
									{
										type: 'cash',
										currencyId: trans.curr.id,
										amount: new Decimal(trans.amount),
									},
								],
							},
						},
					})
					createdPayments++
				}
			}
		}

		return {
			suppliers: createdSuppliers,
			arrivals: createdArrivals,
			payments: createdPayments,
			status: 'success',
		}
	}

	async uploadClient(file: Express.Multer.File, query: UploadQueryDto) {
		const workbook = XLSX.read(file.buffer, { type: 'buffer' })
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

		const prisma = this.prisma

		// --- OVERWRITE MODE ---
		if (query.mode === UploadModeEnum.OVERWRITE) {
			await prisma.$transaction([prisma.clientPaymentModel.deleteMany({}), prisma.sellingModel.deleteMany({}), prisma.clientModel.deleteMany({})])
		}

		// --- HELPERS (unchanged) ---
		const parseNum = (val: any) => {
			if (val === null || val === undefined || val === '') return 0
			const cleaned = String(val).replace(/\s/g, '').replace(',', '.')
			return isNaN(parseFloat(cleaned)) ? 0 : parseFloat(cleaned)
		}

		const normalizePhone = (phoneRaw: string | null) => {
			if (!phoneRaw) return null
			const digits = String(phoneRaw).replace(/\D/g, '')
			if (!digits) return null
			if (digits.length === 9) return '+998' + digits
			if (digits.startsWith('998') && digits.length === 12) return '+' + digits
			return '+' + digits
		}

		const getOrCreateCurrency = async (symbol: string) => {
			const cleanSymbol = symbol.trim().toUpperCase()
			let currency = await prisma.currencyModel.findFirst({ where: { symbol: cleanSymbol } })
			if (!currency) {
				currency = await prisma.currencyModel.create({
					data: { symbol: cleanSymbol, name: cleanSymbol, exchangeRate: 1 },
				})
			}
			return currency
		}

		const staff = (await prisma.staffModel.findFirst({ where: { type: 'admin' } })) || (await prisma.staffModel.findFirst({ where: { type: 'staff' } }))
		if (!staff) throw new Error("Mas'ul xodim (staff) topilmadi")

		let product = await prisma.productModel.findFirst({ where: { name: '__IMPORT_PRODUCT__' } })
		if (!product) {
			product = await prisma.productModel.create({ data: { name: '__IMPORT_PRODUCT__', deletedAt: new Date() } })
		}

		const usdCurrency = await getOrCreateCurrency('USD')
		const uzsCurrency = await getOrCreateCurrency('UZS')

		let createdClients = 0,
			createdSellings = 0,
			createdPayments = 0

		// --- PROCESS ROWS ---
		for (let i = 3; i < rows.length; i++) {
			const row = rows[i]
			// Agar qator bo'sh bo'lsa yoki Ism ustunida ma'lumot bo'lmasa tashlab ketamiz
			if (!row || row.length === 0 || !row[1]) continue

			const fullname = String(row[1] || '').trim()
			// Jami/Summa qatorlarini hisobga olmaymiz
			if (fullname.toLowerCase().includes('итого') || fullname.toLowerCase().includes('сумма')) continue

			const phone = normalizePhone(row[12])
			const uzsBalance = parseNum(row[3])
			const usdBalance = parseNum(row[4])

			// 1. Clientni topamiz yoki yaratamiz (Balansi 0 bo'lsa ham bu yerda yaratiladi)
			let client = null
			if (phone) {
				client = await prisma.clientModel.findFirst({ where: { phone } })
			}

			if (!client) {
				client = await prisma.clientModel.create({
					data: { fullname, phone: phone || undefined },
				})
				createdClients++
			}

			// 2. Faqat balansi 0 bo'lmaganlar uchun tranzaksiya (Selling/Payment) ochamiz
			const balances = [
				{ curr: uzsCurrency, amount: uzsBalance },
				{ curr: usdCurrency, amount: usdBalance },
			]

			for (const b of balances) {
				if (b.amount === 0) continue // Qarz bo'lmasa model yaratmaymiz

				if (b.amount > 0) {
					// Musbat bo'lsa - Selling
					await prisma.sellingModel.create({
						data: {
							clientId: client.id,
							staffId: staff.id,
							status: 'accepted',
							products: {
								create: [
									{
										count: 1,
										staffId: staff.id,
										productId: product.id,
										prices: {
											create: [
												{
													type: 'selling',
													price: new Decimal(b.amount),
													totalPrice: new Decimal(b.amount),
													currencyId: b.curr.id,
												},
											],
										},
									},
								],
							},
						},
					})
					createdSellings++
				} else {
					// Manfiy bo'lsa - Payment
					await prisma.clientPaymentModel.create({
						data: {
							clientId: client.id,
							staffId: staff.id,
							paymentMethods: {
								create: [
									{
										type: 'cash',
										currencyId: b.curr.id,
										amount: new Decimal(Math.abs(b.amount)),
									},
								],
							},
						},
					})
					createdPayments++
				}
			}
		}

		return {
			clients: createdClients,
			sellings: createdSellings,
			payments: createdPayments,
			status: 'success',
		}
	}

	async uploadProduct(file: Express.Multer.File, query: UploadQueryDto) {
		const workbook = XLSX.read(file.buffer, { type: 'buffer' })
		const sheet = workbook.Sheets[workbook.SheetNames[0]]
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

		const prisma = this.prisma

		// --- CURRENCY CHECK ---
		const usdCurrency = await prisma.currencyModel.findFirst({ where: { symbol: 'USD' } })
		let uzsCurrency = await prisma.currencyModel.findFirst({ where: { symbol: 'UZS' } })

		if (!uzsCurrency) {
			uzsCurrency = await prisma.currencyModel.create({
				data: { name: "So'm", symbol: 'UZS', exchangeRate: 1 },
			})
		}
		if (!usdCurrency) {
			throw new Error('USD valyutasi bazada mavjud emas!')
		}

		// --- OVERWRITE MODE ---
		if (query.mode === UploadModeEnum.OVERWRITE) {
			await prisma.$transaction([prisma.productPriceModel.deleteMany({}), prisma.productModel.deleteMany({})])
		}

		let createdCount = 0

		// --- BATCH PROCESS ---
		// Transaction ichida ishlash tezlikni oshiradi
		await prisma.$transaction(
			async (tx) => {
				for (let i = 0; i < rows.length; i++) {
					if (i < 2) continue // Sarlavhalarni tashlab o'tamiz

					const row = rows[i]
					if (!row || row.length === 0 || !row[1]) continue

					const productName = String(row[1] || '').trim()
					if (productName.toLowerCase().includes('сумма') || productName.toLowerCase().includes('итого')) continue

					const productCount = Math.round(Number(row[3] || 0))

					// Price Mapping
					const pricesConfig = [
						{ type: PriceTypeEnum.selling, priceIdx: 4, currIdx: 5, totalIdx: 6 },
						{ type: PriceTypeEnum.wholesale, priceIdx: 7, currIdx: 8, totalIdx: 9 },
						{ type: PriceTypeEnum.cost, priceIdx: 10, currIdx: 11, totalIdx: 12 },
					]

					const finalPrices = []

					for (const p of pricesConfig) {
						const price = Number(row[p.priceIdx] || 0)
						const currencyStr = String(row[p.currIdx] || 'USD')
							.trim()
							.toUpperCase()
						const total = Number(row[p.totalIdx] || 0)

						if (price > 0) {
							const currencyId = currencyStr === 'UZS' ? uzsCurrency.id : usdCurrency.id

							// Infinity oldini olish uchun exchange rate hisobi
							const rate = price !== 0 ? total / price : 0

							finalPrices.push({
								type: p.type,
								price: new Decimal(price),
								totalPrice: new Decimal(total),
								currencyId: currencyId,
								exchangeRate: new Decimal(rate),
							})
						}
					}

					// Create Product
					await tx.productModel.create({
						data: {
							name: productName,
							count: productCount,
							prices: finalPrices.length ? { create: finalPrices } : undefined,
						},
					})

					createdCount++
				}
			},
			{ timeout: 60000 },
		) // Katta fayllar uchun timeoutni oshirdik

		return {
			importedProducts: createdCount,
			status: 'success',
		}
	}
}
