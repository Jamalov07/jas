/* eslint-disable @typescript-eslint/no-misused-promises */
/**
 * Har bir asosiy jadval uchun kamida 10 ta namuna.
 * `pnpm prisma db seed --schema prisma/schema.prisma` (jas papkasida).
 */
import { config } from 'dotenv'
import { resolve } from 'path'
import { ActionMethodEnum, ChangeMethodEnum, PaymentMethodEnum, PriceTypeEnum, SellingStatusEnum, StaffTypeEnum, PageEnum, BotLanguageEnum, PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

config({ path: resolve(__dirname, '../.env') })

const prisma = new PrismaClient()
const N = 10

const dec = (n: number) => String(n)

function phone(prefix: string, batch: number, i: number) {
	const mid = String(batch % 10_000_000).padStart(7, '0')
	return `${prefix}${mid}${String(i).padStart(2, '0')}`.slice(0, 15)
}

async function main() {
	const batch = Date.now()
	const pwd = await bcrypt.hash('Test123!', 7)

	const uzs = await prisma.currencyModel.upsert({
		where: { name: 'UZS' },
		create: { name: 'UZS', symbol: 'UZS', exchangeRate: 1, isActive: true },
		update: {},
	})
	const usd = await prisma.currencyModel.upsert({
		where: { name: 'USD' },
		create: { name: 'USD', symbol: 'USD', exchangeRate: 12650, isActive: true },
		update: {},
	})

	const extraCurrencies = []
	for (let i = 0; i < 8; i++) {
		const name = `SEED_${batch}_C${i}`
		extraCurrencies.push(
			await prisma.currencyModel.create({
				data: {
					name,
					symbol: `S${i}`,
					exchangeRate: 1 + i * 0.1,
					isActive: true,
				},
			}),
		)
	}
	const allCurrencies = [uzs, usd, ...extraCurrencies]

	const permissions = await Promise.all(
		Array.from({ length: N }, (_, i) =>
			prisma.permissionModel.create({
				data: { name: `seed_perm_${batch}_${i}` },
			}),
		),
	)

	const methods: ActionMethodEnum[] = [
		ActionMethodEnum.get,
		ActionMethodEnum.post,
		ActionMethodEnum.patch,
		ActionMethodEnum.delete,
		ActionMethodEnum.put,
		ActionMethodEnum.get,
		ActionMethodEnum.post,
		ActionMethodEnum.patch,
		ActionMethodEnum.delete,
		ActionMethodEnum.get,
	]
	const actions = await Promise.all(
		Array.from({ length: N }, (_, i) =>
			prisma.actionModel.create({
				data: {
					url: `/seed/${batch}/${i}`,
					name: `SeedAction_${i}`,
					method: methods[i],
					description: `batch ${batch}`,
					permissionId: permissions[i % N].id,
				},
			}),
		),
	)
	const actionIds = actions.map((a) => ({ id: a.id }))

	const staffs = await Promise.all(
		Array.from({ length: N + 1 }, (_, i) =>
			prisma.staffModel.create({
				data: {
					fullname: `Seed xodim ${batch}-${i}`,
					phone: phone('99893', batch, i),
					password: pwd,
					type: i === 0 ? StaffTypeEnum.admin : StaffTypeEnum.staff,
					currencyId: uzs.id,
					pages: [
						PageEnum.stat,
						PageEnum.product,
						PageEnum.selling,
						PageEnum.arrival,
						PageEnum.returning,
						PageEnum.client,
						PageEnum.clientpayment,
						PageEnum.clientreport,
						PageEnum.supplier,
						PageEnum.supplierpayment,
						PageEnum.stuff,
						PageEnum.stuffpayment,
					],
					actions: { connect: actionIds },
				},
			}),
		),
	)
	const staffPool = staffs

	const clients = await Promise.all(
		Array.from({ length: N }, (_, i) =>
			prisma.clientModel.create({
				data: {
					fullname: `Seed mijoz ${batch}-${i}`,
					phone: phone('99891', batch, i),
				},
			}),
		),
	)

	const suppliers = await Promise.all(
		Array.from({ length: N }, (_, i) =>
			prisma.supplierModel.create({
				data: {
					fullname: `Seed ta'minotchi ${batch}-${i}`,
					phone: phone('99892', batch, i),
				},
			}),
		),
	)

	const products = await Promise.all(
		Array.from({ length: N }, (_, i) =>
			prisma.productModel.create({
				data: {
					name: `Seed mahsulot ${batch}-${i}`,
					description: 'prisma seed',
					count: 1000 + i * 10,
					minAmount: 1 + i,
					prices: {
						create: [
							{
								type: PriceTypeEnum.cost,
								price: dec(10000 + i * 100),
								totalPrice: dec(10000 + i * 100),
								exchangeRate: 1,
								currencyId: uzs.id,
							},
							{
								type: PriceTypeEnum.selling,
								price: dec(15000 + i * 100),
								totalPrice: dec(15000 + i * 100),
								exchangeRate: 1,
								currencyId: uzs.id,
							},
							{
								type: PriceTypeEnum.wholesale,
								price: dec(13000 + i * 100),
								totalPrice: dec(13000 + i * 100),
								exchangeRate: 1,
								currencyId: uzs.id,
							},
						],
					},
				},
			}),
		),
	)

	const baseDate = new Date()
	const pmRotate: PaymentMethodEnum[] = [
		PaymentMethodEnum.cash,
		PaymentMethodEnum.transfer,
		PaymentMethodEnum.uzcard,
		PaymentMethodEnum.humo,
		PaymentMethodEnum.click,
		PaymentMethodEnum.payme,
		PaymentMethodEnum.visa,
		PaymentMethodEnum.uzum,
		PaymentMethodEnum.other,
		PaymentMethodEnum.cash,
	]

	for (let i = 0; i < N; i++) {
		const selling = await prisma.sellingModel.create({
			data: {
				status: SellingStatusEnum.accepted,
				date: new Date(baseDate.getTime() - i * 86400000),
				clientId: clients[i].id,
				staffId: staffPool[i % staffPool.length].id,
				products: {
					create: [
						{
							count: 2 + i,
							productId: products[i].id,
							staffId: staffPool[i % staffPool.length].id,
							prices: {
								create: [
									{
										type: PriceTypeEnum.selling,
										price: dec(15000 + i * 100),
										totalPrice: dec((15000 + i * 100) * (2 + i)),
										currencyId: uzs.id,
									},
								],
							},
						},
					],
				},
			},
		})

		await prisma.clientSellingPaymentModel.create({
			data: {
				sellingId: selling.id,
				clientId: clients[i].id,
				staffId: staffPool[i % staffPool.length].id,
				description: `seed selling pay ${batch}-${i}`,
				paymentMethods: {
					create: [
						{
							type: pmRotate[i],
							amount: dec(10000 + i * 500),
							currencyId: uzs.id,
						},
					],
				},
				changeMethods: {
					create: [
						{
							type: ChangeMethodEnum.cash,
							amount: dec(500 + i * 10),
							currencyId: uzs.id,
						},
					],
				},
			},
		})
	}

	for (let i = 0; i < N; i++) {
		const arrival = await prisma.arrivalModel.create({
			data: {
				date: new Date(baseDate.getTime() - i * 43200000),
				supplierId: suppliers[i].id,
				staffId: staffPool[i % staffPool.length].id,
				products: {
					create: [
						{
							count: 20 + i,
							productId: products[(i + 1) % N].id,
							staffId: staffPool[i % staffPool.length].id,
							prices: {
								create: [
									{
										type: PriceTypeEnum.cost,
										price: dec(10000),
										totalPrice: dec(10000 * (20 + i)),
										currencyId: uzs.id,
									},
								],
							},
						},
					],
				},
			},
		})

		await prisma.supplierArrivalPaymentModel.create({
			data: {
				arrivalId: arrival.id,
				supplierId: suppliers[i].id,
				staffId: staffPool[i % staffPool.length].id,
				description: `seed arr pay ${batch}-${i}`,
				paymentMethods: {
					create: [
						{
							type: pmRotate[(i + 3) % N],
							amount: dec(50000 + i * 1000),
							currencyId: uzs.id,
						},
					],
				},
				changeMethods: {
					create: [
						{
							type: ChangeMethodEnum.balance,
							amount: dec(100 + i),
							currencyId: uzs.id,
						},
					],
				},
			},
		})
	}

	for (let i = 0; i < N; i++) {
		const returning = await prisma.returningModel.create({
			data: {
				status: SellingStatusEnum.accepted,
				date: new Date(baseDate.getTime() - i * 3600000),
				clientId: clients[(i + 2) % N].id,
				staffId: staffPool[(i + 1) % staffPool.length].id,
				products: {
					create: [
						{
							count: 1 + (i % 3),
							productId: products[(i + 3) % N].id,
							staffId: staffPool[(i + 1) % staffPool.length].id,
							prices: {
								create: [
									{
										type: PriceTypeEnum.selling,
										price: dec(15000),
										totalPrice: dec(15000 * (1 + (i % 3))),
										currencyId: uzs.id,
									},
								],
							},
						},
					],
				},
			},
		})

		await prisma.clientReturningPaymentModel.create({
			data: {
				returningId: returning.id,
				clientId: clients[(i + 2) % N].id,
				staffId: staffPool[(i + 1) % staffPool.length].id,
				description: `seed ret pay ${batch}-${i}`,
				paymentMethods: {
					create: [
						{
							type: pmRotate[(i + 5) % N],
							amount: dec(15000),
							currencyId: uzs.id,
						},
					],
				},
				changeMethods: {
					create: [
						{
							type: ChangeMethodEnum.cash,
							amount: dec(200),
							currencyId: uzs.id,
						},
					],
				},
			},
		})
	}

	for (let i = 0; i < N; i++) {
		await prisma.clientPaymentModel.create({
			data: {
				clientId: clients[i].id,
				staffId: staffPool[i % staffPool.length].id,
				description: `seed client payment ${batch}-${i}`,
				paymentMethods: {
					create: [
						{
							type: pmRotate[(i + 7) % N],
							amount: dec(200000 + i * 10000),
							currencyId: uzs.id,
						},
					],
				},
				changeMethods: {
					create: [
						{
							type: ChangeMethodEnum.cash,
							amount: dec(1000 + i * 50),
							currencyId: uzs.id,
						},
					],
				},
			},
		})
	}

	for (let i = 0; i < N; i++) {
		await prisma.supplierPaymentModel.create({
			data: {
				supplierId: suppliers[i].id,
				staffId: staffPool[(i + 2) % staffPool.length].id,
				description: `seed supplier payment ${batch}-${i}`,
				paymentMethods: {
					create: [
						{
							type: pmRotate[i],
							amount: dec(300000 + i * 5000),
							currencyId: uzs.id,
						},
					],
				},
				changeMethods: {
					create: [
						{
							type: ChangeMethodEnum.balance,
							amount: dec(500 + i * 20),
							currencyId: uzs.id,
						},
					],
				},
			},
		})
	}

	for (let i = 0; i < N; i++) {
		const payer = staffPool[i % staffPool.length]
		const employee = staffPool[(i + 1) % staffPool.length]
		await prisma.staffPaymentModel.create({
			data: {
				staffId: payer.id,
				employeeId: employee.id,
				description: `seed ish haqi ${batch}-${i}`,
				methods: {
					create: [
						{
							type: PaymentMethodEnum.transfer,
							amount: dec(1_000_000 + i * 50_000),
							currencyId: uzs.id,
						},
					],
				},
			},
		})
	}

	for (let i = 0; i < N; i++) {
		await prisma.dayCloseLog.create({
			data: {
				closedDate: new Date(Date.UTC(2026, 0, 1 + i)),
			},
		})
	}

	for (let i = 0; i < N; i++) {
		await prisma.botUserModel.create({
			data: {
				id: `seed_bot_${batch}_${i}`,
				clientId: clients[i].id,
				isActive: true,
				language: BotLanguageEnum.uz,
			},
		})
	}

	// eslint-disable-next-line no-console
	console.log('[seed] batch', batch, {
		currencies: 2 + extraCurrencies.length,
		permissions: N,
		actions: N,
		staff: staffPool.length,
		clients: N,
		suppliers: N,
		products: N,
		productPricesApprox: N * 3,
		sellings: N,
		sellingPayments: N,
		arrivals: N,
		supplierArrivalPayments: N,
		returnings: N,
		clientReturningPayments: N,
		clientPayments: N,
		supplierPayments: N,
		staffPayments: N,
		dayCloseLogs: N,
		botUsers: N,
	})
}

main()
	.catch((e) => {
		// eslint-disable-next-line no-console
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
