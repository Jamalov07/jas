import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma'
import { SellingFindOneData } from '../../selling'
import { BotSellingProductTitleEnum } from '../../selling/enums'
import * as pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
import { TDocumentDefinitions } from 'pdfmake/interfaces'
import { logoBase64 } from './constants'
;(pdfMake as any).vfs = vfsFonts

@Injectable()
export class PdfService {
	constructor(private readonly prisma: PrismaService) {}

	/** API javobi `{ selling: { price, totalPrice } }` yoki bot/DB dan massiv */
	private lineSellingPriceParts(item: { prices: unknown }) {
		const p = item.prices as any
		if (p && typeof p === 'object' && !Array.isArray(p) && p.selling) {
			const s = p.selling
			return {
				price: s?.price,
				totalPrice: s?.totalPrice,
				symbol: '' as string,
			}
		}
		const row = Array.isArray(p) ? p[0] : undefined
		return {
			price: row?.price,
			totalPrice: row?.totalPrice,
			symbol: row?.currency?.symbol ?? '',
		}
	}

	async generateInvoicePdfBuffer(selling: SellingFindOneData): Promise<Buffer> {
		const docDefinition: TDocumentDefinitions = {
			content: [
				{
					columns: [
						{
							width: '*',
							stack: [
								{ text: `Клиент: ${selling.client?.fullname ?? ''}`, fontSize: 12, margin: [0, 4, 0, 4] },
								{ text: `Дата продажа: ${this.formatDate(selling.date)}`, fontSize: 12 },
							],
							margin: [0, 20, 0, 0],
						},
						{
							image: 'logo',
							width: 120,
							alignment: 'right',
						},
					],
					margin: [0, 0, 0, 10],
				},
				{
					table: {
						widths: ['auto', '*', 'auto', 'auto', 'auto'],
						body: [
							[
								{ text: '№', bold: true },
								{ text: 'Товар или услуга', bold: true },
								{ text: 'Кол-во', bold: true },
								{ text: 'Цена', bold: true },
								{ text: 'Сумма', bold: true },
							],
							...(selling.products ?? [])
								.filter((item) => (item as any).status !== BotSellingProductTitleEnum.deleted)
								.map((item, index) => {
									const { price: pr, totalPrice: tpr, symbol: sym } = this.lineSellingPriceParts(item)
									const price = pr?.toNumber?.() ?? 0
									const totalPrice = tpr?.toNumber?.() ?? price * item.count
									return [index + 1, item.product.name, item.count, `${price} ${sym}`, `${totalPrice} ${sym}`]
								}),
						],
					},
					layout: {
						hLineWidth: (i, node) => (i === node.table.body.length ? 1.5 : 0.5),
						vLineWidth: (i, node) => (i === node.table.widths.length ? 1.5 : 0.5),
						hLineColor: (i, node) => (i === node.table.body.length ? '#000' : '#aaa'),
						vLineColor: (i, node) => (i === node.table.widths.length ? '#000' : '#aaa'),
						paddingLeft: () => 5,
						paddingRight: () => 5,
						paddingTop: () => 3,
						paddingBottom: () => 3,
					},
					margin: [0, 10, 0, 10],
				},
				{
					text: `Итого: ${selling.totalPrices?.map((t) => `${t.total.toNumber()} ${(t as any).currency?.symbol ?? ''}`).join(' + ') || 0}`,
					fontSize: 13,
					bold: true,
					color: 'red',
					alignment: 'right',
					margin: [0, 5, 0, 0],
				},
			],
			images: {
				logo: logoBase64,
			},
			defaultStyle: {
				font: 'Roboto',
			},
		}

		return new Promise((resolve) => {
			const pdfDocGenerator = pdfMake.createPdf(docDefinition)
			pdfDocGenerator.getBuffer((buffer) => {
				resolve(Buffer.from(buffer))
			})
		})
	}

	async generateInvoicePdfBuffer2(selling: SellingFindOneData): Promise<Buffer> {
		const docDefinition: TDocumentDefinitions = {
			content: [
				{
					columns: [
						{
							width: '*',
							stack: [
								{ text: `Клиент: ${selling.client?.fullname ?? ''}`, fontSize: 12, margin: [0, 4, 0, 4] },
								{ text: `Дата продажа: ${this.formatDate(selling.date)}`, fontSize: 12 },
							],
							margin: [0, 20, 0, 0],
						},
						{
							image: 'logo',
							width: 120,
							alignment: 'right',
						},
					],
					margin: [0, 0, 0, 10],
				},
				{
					table: {
						headerRows: 1,
						widths: ['auto', '*', 50, 70, 80],
						body: [
							[
								{ text: '№', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
								{ text: 'Товар или услуга', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
								{ text: 'Кол-во', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
								{ text: 'Цена', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
								{ text: 'Сумма', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
							],
							...(selling.products ?? [])
								.filter((item) => (item as any).status !== BotSellingProductTitleEnum.deleted)
								.map((item, index) => {
									const { price: pr, totalPrice: tpr, symbol: sym } = this.lineSellingPriceParts(item)
									const price = pr?.toNumber?.() ?? 0
									const totalPrice = tpr?.toNumber?.() ?? price * item.count
									return [
										{ text: index + 1, fontSize: 12, alignment: 'center' },
										{ text: item.product.name, fontSize: 12, alignment: 'left' },
										{ text: item.count.toString(), fontSize: 12, alignment: 'center' },
										{ text: `${price} ${sym}`, fontSize: 12, alignment: 'right' },
										{ text: `${totalPrice} ${sym}`, fontSize: 12, alignment: 'right' },
									]
								}),
						],
					},
					layout: {
						hLineWidth: () => 0.8,
						vLineWidth: () => 0.8,
						hLineColor: () => '#666',
						vLineColor: () => '#666',
						paddingLeft: () => 6,
						paddingRight: () => 6,
						paddingTop: () => 6,
						paddingBottom: () => 6,
					},
					margin: [0, 10, 0, 10],
				},
				{
					text: `Итого: ${selling.totalPrices?.map((t) => `${t.total.toNumber()} ${(t as any).currency?.symbol ?? ''}`).join(' + ') || 0}`,
					fontSize: 13,
					bold: true,
					color: 'red',
					alignment: 'right',
					margin: [0, 5, 0, 0],
				},
			],
			images: {
				logo: logoBase64,
			},
			defaultStyle: {
				font: 'Roboto',
			},
		}

		return new Promise((resolve) => {
			const pdfDocGenerator = pdfMake.createPdf(docDefinition)
			pdfDocGenerator.getBuffer((buffer) => {
				resolve(Buffer.from(buffer))
			})
		})
	}

	private formatDate(date: Date): string {
		const dd = String(date.getDate()).padStart(2, '0')
		const mm = String(date.getMonth() + 1).padStart(2, '0')
		const yyyy = date.getFullYear()
		const hh = String(date.getHours()).padStart(2, '0')
		const min = String(date.getMinutes()).padStart(2, '0')
		return `${dd}.${mm}.${yyyy} ${hh}:${min}`
	}
}
