import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma'
import { SellingFindOneData } from '../../selling'
import { BotSellingProductTitleEnum } from '../../selling/enums'
import { buildSellingPdfFooterSummaryBlock } from '../../selling/helpers/selling-channel-summary.helper'
import * as pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
import { TDocumentDefinitions, Content } from 'pdfmake/interfaces'
import { formatDdMmYyyyHhMmForUzDisplay } from '../../../common'
import { jasInstagramQrCodeBase64, jasTelegramQrCodeBase64, resolveBrandName, resolvePdfLogoBase64 } from './constants'
import { Decimal } from '@prisma/client/runtime/library'
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
				price: s.price.mul(new Decimal(100).minus(s.discount ?? 0)).div(100) || s.price,
				totalPrice: s?.totalPrice,
				symbol: '' as string,
			}
		}
		const row = Array.isArray(p) ? p[0] : undefined
		return {
			price: row?.price.mul(new Decimal(100).minus(row?.discount ?? 0)).div(100) || row?.price,
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
				logo: resolvePdfLogoBase64(),
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
		const jasQrHeader: Content | undefined =
			resolveBrandName() === 'JAS'
				? ({
						columns: [
							{
								image: 'jasTelegramQrCode',
								width: 70,
								alignment: 'left',
							},
							{
								width: '*',
								stack: [
									{ text: `Jasur G Blok 8-do'kon`, fontSize: 18, alignment: 'center', margin: [0, 4, 0, 4] },
									{ text: `Jasur 91-773-22-99 Dilshod 91-733-22-99 Axror 97-950-86-83`, alignment: 'center', fontSize: 12 },
								],
								margin: [0, 20, 0, 0],
							},
							{
								image: 'jasInstagramQrCode',
								width: 90,
								alignment: 'right',
							},
						],
						margin: [0, 0, 0, 5],
					} as Content)
				: undefined

		const docDefinition: TDocumentDefinitions = {
			content: [
				...(jasQrHeader ? [jasQrHeader] : []),
				{
					columns: [
						{
							width: '*',
							stack: [
								{ text: `Xaridor: ${selling.client?.fullname ?? ''}`, fontSize: 12, margin: [0, 4, 0, 4] },
								{ text: `Sotuv vaqti: ${this.formatDate(selling.date)}`, fontSize: 12 },
							],
							margin: [0, 20, 0, 0],
						},
						resolveBrandName() === 'JAS'
							? undefined
							: {
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
								{ text: 'Mahsulot nomi', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
								{ text: 'Soni', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
								{ text: 'Narxi', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
								{ text: 'Jami', bold: true, alignment: 'center', fillColor: '#f2f2f2', fontSize: 13 },
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
					text: `Jami: ${selling.totalPrices?.map((t) => `${t.total.toNumber()} ${(t as any).currency?.symbol ?? ''}`).join(' + ') || 0}`,
					fontSize: 13,
					bold: true,
					color: 'red',
					alignment: 'right',
					margin: [0, 5, 0, 0],
				},
				{
					text: buildSellingPdfFooterSummaryBlock(selling as SellingFindOneData, (d) => this.formatDate(d)),
					fontSize: 11,
					alignment: 'left',
					margin: [0, 12, 0, 0],
					lineHeight: 1.4,
				},
			],
			images: {
				logo: resolvePdfLogoBase64(),
				jasTelegramQrCode: jasTelegramQrCodeBase64,
				jasInstagramQrCode: jasInstagramQrCodeBase64,
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
		return formatDdMmYyyyHhMmForUzDisplay(date)
	}
}
