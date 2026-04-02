import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma'
import { SellingFindOneData } from '../../selling'
import * as pdfMake from 'pdfmake/build/pdfmake'
import vfsFonts from 'pdfmake/build/vfs_fonts'
import { TDocumentDefinitions } from 'pdfmake/interfaces'
import { logoBase64 } from './constants'
import { BotSellingProductTitleEnum } from '../../selling/enums'
;(pdfMake as any).vfs = vfsFonts

@Injectable()
export class PdfService {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async generateInvoicePdfBuffer(selling: SellingFindOneData): Promise<Buffer> {
		const docDefinition: TDocumentDefinitions = {
			content: [
				{
					columns: [
						{
							width: '*',
							stack: [
								{ text: `Клиент: ${selling.client.fullname}`, fontSize: 12, margin: [0, 4, 0, 4] },
								{ text: `Дата продажа: ${this.formatDate(selling.date)}`, fontSize: 12 },
							],
							margin: [0, 20, 0, 0], // **shu bilan balandlikni logo darajasiga tushiramiz**
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
							...selling.products.map((item, index) => [index + 1, item.product.name, item.count, item.price.toNumber(), item.price.mul(item.count).toNumber()]),
						],
					},
					layout: {
						hLineWidth: function (i, node) {
							// **pastki border qalin, qolganlari yupqa**
							return i === node.table.body.length ? 1.5 : 0.5
						},
						vLineWidth: function (i, node) {
							// **o‘ng border qalin, qolganlari yupqa**
							return i === node.table.widths.length ? 1.5 : 0.5
						},
						hLineColor: function (i, node) {
							return i === node.table.body.length ? '#000' : '#aaa'
						},
						vLineColor: function (i, node) {
							return i === node.table.widths.length ? '#000' : '#aaa'
						},
						paddingLeft: function () {
							return 5
						},
						paddingRight: function () {
							return 5
						},
						paddingTop: function () {
							return 3
						},
						paddingBottom: function () {
							return 3
						},
					},
					margin: [0, 10, 0, 10],
				},
				{
					text: `Итого: ${selling.totalPrice?.toNumber() || 0}`,
					fontSize: 13,
					bold: true,
					color: 'red',
					alignment: 'right',
					margin: [0, 5, 0, 0],
				},
				{
					text: `Остальный долг: ${selling.debt?.toNumber() || 0}`,
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

		return new Promise((resolve, reject) => {
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
								{ text: `Клиент: ${selling.client.fullname}`, fontSize: 12, margin: [0, 4, 0, 4] },
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
							...selling.products
								.filter((pro) => pro.status !== BotSellingProductTitleEnum.deleted)
								.map((item, index) => {
									return [
										{ text: index + 1, fontSize: 12, alignment: 'center' },
										{ text: item.product.name, fontSize: 12, alignment: 'left' },
										{ text: item.count.toString(), fontSize: 12, alignment: 'center' },
										{ text: item.price.toNumber().toString(), fontSize: 12, alignment: 'right' },
										{ text: item.price.mul(item.count).toNumber().toString(), fontSize: 12, alignment: 'right' },
									]
								}),
						],
					},
					layout: {
						hLineWidth: function () {
							return 0.8
						},
						vLineWidth: function () {
							return 0.8
						},
						hLineColor: function () {
							return '#666'
						},
						vLineColor: function () {
							return '#666'
						},
						paddingLeft: function () {
							return 6
						},
						paddingRight: function () {
							return 6
						},
						paddingTop: function () {
							return 6
						},
						paddingBottom: function () {
							return 6
						},
					},
					margin: [0, 10, 0, 10],
				},
				{
					text: `Итого: ${selling.totalPrice?.toNumber() || 0}`,
					fontSize: 13,
					bold: true,
					color: 'red',
					alignment: 'right',
					margin: [0, 5, 0, 0],
				},
				{
					text: `Остальный долг: ${selling.debt?.toNumber() || 0}`,
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

		return new Promise((resolve, reject) => {
			const pdfDocGenerator = pdfMake.createPdf(docDefinition)
			pdfDocGenerator.getBuffer((buffer) => {
				resolve(Buffer.from(buffer))
			})
		})
	}

	private formatDate(date: Date): string {
		const dd = String(date.getDate()).padStart(2, '0')
		const mm = String(date.getMonth() + 1).padStart(2, '0') // 0-based
		const yyyy = date.getFullYear()

		const hh = String(date.getHours()).padStart(2, '0')
		const min = String(date.getMinutes()).padStart(2, '0')

		return `${dd}.${mm}.${yyyy} ${hh}:${min}`
	}

	private getColor(status?: BotSellingProductTitleEnum): string | undefined {
		if (status === BotSellingProductTitleEnum.new) return '#d4edda' // light green
		if (status === BotSellingProductTitleEnum.deleted) return '#f8d7da' // light red
		if (status === BotSellingProductTitleEnum.updated) return '#fff3cd' // light yellow
		return undefined // default (white)
	}
}
