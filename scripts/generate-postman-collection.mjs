import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'postman_collection.json')

const PAGINATION = [
	{ key: 'pageNumber', value: '1', description: 'Sahifa raqami (1-based)' },
	{ key: 'pageSize', value: '20', description: 'Sahifa hajmi' },
	{ key: 'pagination', value: 'true', description: 'Pagination yoqish' },
]

function url(pathSegments, query = []) {
	const path = Array.isArray(pathSegments) ? pathSegments : pathSegments.split('/').filter(Boolean)
	return {
		raw: `{{baseUrl}}/${path.join('/')}${query.length ? '?' + query.filter((q) => !q.disabled).map((q) => `${q.key}=${encodeURIComponent(q.value)}`).join('&') : ''}`,
		host: ['{{baseUrl}}'],
		path,
		...(query.length ? { query } : {}),
	}
}

function jsonBody(obj) {
	return {
		mode: 'raw',
		raw: JSON.stringify(obj, null, 2),
		options: { raw: { language: 'json' } },
	}
}

function req(name, method, pathSegments, opts = {}) {
	const { query = [], body, auth, header = [], description } = opts
	const headers = [...header]
	if (body && !headers.some((h) => h.key === 'Content-Type')) {
		headers.push({ key: 'Content-Type', value: 'application/json' })
	}
	return {
		name,
		...(description ? { description } : {}),
		...(opts.event ? { event: opts.event } : {}),
		request: {
			...(auth !== undefined ? { auth } : {}),
			method,
			header: headers,
			...(body ? { body } : {}),
			url: url(pathSegments, query),
			...(description ? { description } : {}),
		},
	}
}

function folder(name, items, description) {
	return { name, ...(description ? { description } : {}), item: items }
}

const signInTestScript = {
	listen: 'test',
	script: {
		type: 'text/javascript',
		exec: [
			"const res = pm.response.json();",
			"if (res.data?.accessToken) {",
			"  pm.collectionVariables.set('accessToken', res.data.accessToken);",
			"  pm.collectionVariables.set('refreshToken', res.data.refreshToken);",
			"}",
		],
	},
}

const collection = {
	info: {
		_postman_id: 'jas-api-collection-v2',
		name: 'JAS API Collection',
		description:
			'JAS backend API — barcha endpointlar (2026).\\n\\n**Sozlash:**\\n1. `baseUrl` — default `http://localhost:5000`\\n2. **Sign In** ni ishga tushiring (token avtomatik saqlanadi)\\n3. Pagination: `pageNumber`, `pageSize`, `pagination=true`\\n\\n**Auth talab qilinadigan endpointlar** bearer token bilan ishlaydi (selling/arrival create, staff profile, va h.k.)',
		schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
	},
	variable: [
		{ key: 'baseUrl', value: 'http://localhost:5000', type: 'string' },
		{ key: 'accessToken', value: '', type: 'string' },
		{ key: 'refreshToken', value: '', type: 'string' },
		{ key: 'clientId', value: '', type: 'string' },
		{ key: 'supplierId', value: '', type: 'string' },
		{ key: 'productId', value: '', type: 'string' },
		{ key: 'currencyId', value: '', type: 'string' },
		{ key: 'staffId', value: '', type: 'string' },
		{ key: 'sellingId', value: '', type: 'string' },
	],
	auth: {
		type: 'bearer',
		bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }],
	},
	item: [
		folder('Health', [
			req('Health Check', 'GET', ['health'], {
				auth: { type: 'noauth' },
				description: 'Server holati. Auth talab qilinmaydi.',
			}),
		]),

		folder('Auth', [
			req('Sign In', 'POST', ['auth', 'sign-in'], {
				auth: { type: 'noauth' },
				body: jsonBody({ phone: '+998901234567', password: 'password123' }),
				event: [signInTestScript],
			}),
			req('Get Profile', 'GET', ['auth', 'profile'], { description: 'Auth talab qilinadi (@AuthOptions true,true)' }),
			req('Sign Out', 'POST', ['auth', 'sign-out'], { description: 'Auth talab qilinadi' }),
			req('Refresh Token', 'POST', ['auth', 'refresh-token'], {
				auth: { type: 'noauth' },
				header: [{ key: 'Authorization', value: 'Bearer {{refreshToken}}' }],
				event: [signInTestScript],
			}),
		]),

		folder('Common', [
			req('Create Day Close', 'POST', ['common', 'day-close'], { auth: { type: 'noauth' } }),
			req('Get Day Close', 'GET', ['common', 'day-close'], { auth: { type: 'noauth' } }),
			req('Update Staff Currency', 'PATCH', ['common', 'staff', 'currency'], {
				body: jsonBody({ currencyId: '{{currencyId}}' }),
				description: 'Auth talab qilinadi',
			}),
		]),

		folder('Action', [
			req('Find Many', 'GET', ['action', 'many'], {
				query: [...PAGINATION, { key: 'name', value: '', disabled: true }, { key: 'permissionId', value: '', disabled: true }],
			}),
			req('Find One', 'GET', ['action', 'one'], { query: [{ key: 'id', value: 'ACTION_UUID' }] }),
			req('Update One', 'PATCH', ['action', 'one'], {
				query: [{ key: 'id', value: 'ACTION_UUID' }],
				body: jsonBody({ description: 'Updated', permissionId: 'PERMISSION_UUID' }),
			}),
		]),

		folder('Permission', [
			req('Find Many', 'GET', ['permission', 'many'], {
				query: [...PAGINATION, { key: 'name', value: '', disabled: true }],
				auth: { type: 'noauth' },
			}),
			req('Find One', 'GET', ['permission', 'one'], { query: [{ key: 'id', value: 'PERMISSION_UUID' }] }),
			req('Create One', 'POST', ['permission', 'one'], {
				body: jsonBody({ name: 'manager', actionsToConnect: [] }),
			}),
			req('Update One', 'PATCH', ['permission', 'one'], {
				query: [{ key: 'id', value: 'PERMISSION_UUID' }],
				body: jsonBody({ name: 'admin', actionsToConnect: [], actionsToDisconnect: [] }),
			}),
			req('Delete One', 'DELETE', ['permission', 'one'], { query: [{ key: 'id', value: 'PERMISSION_UUID' }] }),
		]),

		folder('Currency', [
			req('Find Many', 'GET', ['currency', 'many'], {
				query: [...PAGINATION, { key: 'search', value: '', disabled: true }, { key: 'isActive', value: 'true', disabled: true }],
				auth: { type: 'noauth' },
			}),
			req('Find One', 'GET', ['currency', 'one'], { query: [{ key: 'id', value: '{{currencyId}}' }] }),
			req('Create One', 'POST', ['currency', 'one'], {
				body: jsonBody({ name: 'USD', symbol: '$', exchangeRate: 12500, isActive: true }),
			}),
			req('Update One', 'PATCH', ['currency', 'one'], {
				query: [{ key: 'id', value: '{{currencyId}}' }],
				body: jsonBody({ exchangeRate: 12700 }),
			}),
			req('Delete One', 'DELETE', ['currency', 'one'], { query: [{ key: 'id', value: '{{currencyId}}' }] }),
		]),

		folder('Staff', [
			req('Find Many', 'GET', ['staff', 'many'], {
				query: [...PAGINATION, { key: 'search', value: '', disabled: true }],
			}),
			req('Find Many Deleted', 'GET', ['staff', 'many', 'deleted'], {
				query: [...PAGINATION],
			}),
			req('Find One', 'GET', ['staff', 'one'], { query: [{ key: 'id', value: '{{staffId}}' }] }),
			req('Create One', 'POST', ['staff', 'one'], {
				body: jsonBody({
					fullname: 'Bobur Karimov',
					phone: '+998911234567',
					password: 'securePass123',
					actionsToConnect: [],
					pagesToConnect: [],
				}),
			}),
			req('Update One', 'PATCH', ['staff', 'one'], {
				query: [{ key: 'id', value: '{{staffId}}' }],
				body: jsonBody({ fullname: 'Yangilangan Ism', currencyId: '{{currencyId}}' }),
			}),
			req('Restore One', 'PATCH', ['staff', 'one', 'restore'], {
				query: [{ key: 'id', value: '{{staffId}}' }],
			}),
			req('Delete One', 'DELETE', ['staff', 'one'], {
				query: [
					{ key: 'id', value: '{{staffId}}' },
					{ key: 'method', value: 'soft' },
				],
			}),
		]),

		folder('Product', [
			req('Find Many (optimized)', 'GET', ['product', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'search', value: '', disabled: true },
					{ key: 'sortByLastSellingDate', value: 'true', disabled: true },
					{ key: 'clientId', value: '', disabled: true },
				],
				auth: { type: 'noauth' },
			}),
			req('Find Many Old', 'GET', ['product', 'many-old'], {
				query: [...PAGINATION, { key: 'search', value: '', disabled: true }],
				auth: { type: 'noauth' },
			}),
			req('Find One', 'GET', ['product', 'one'], { query: [{ key: 'id', value: '{{productId}}' }] }),
			req('Create One (multipart)', 'POST', ['product', 'one'], {
				header: [],
				body: {
					mode: 'formdata',
					formdata: [
						{ key: 'name', value: 'Mahsulot nomi', type: 'text' },
						{ key: 'count', value: '100', type: 'text' },
						{ key: 'minAmount', value: '5', type: 'text' },
						{ key: 'description', value: 'Tavsif', type: 'text' },
						{ key: 'prices_cost_price', value: '5000', type: 'text' },
						{ key: 'prices_cost_currencyId', value: '{{currencyId}}', type: 'text' },
						{ key: 'prices_selling_price', value: '8000', type: 'text' },
						{ key: 'prices_selling_currencyId', value: '{{currencyId}}', type: 'text' },
						{ key: 'image', type: 'file', src: [], disabled: true },
					],
				},
				description: 'multipart/form-data — image ixtiyoriy',
			}),
			req('Update One (multipart)', 'PATCH', ['product', 'one'], {
				query: [{ key: 'id', value: '{{productId}}' }],
				header: [],
				body: {
					mode: 'formdata',
					formdata: [
						{ key: 'name', value: 'Yangilangan nom', type: 'text' },
						{ key: 'count', value: '120', type: 'text' },
						{ key: 'prices_selling_price', value: '8500', type: 'text' },
						{ key: 'prices_selling_currencyId', value: '{{currencyId}}', type: 'text' },
					],
				},
			}),
			req('Delete One', 'DELETE', ['product', 'one'], { query: [{ key: 'id', value: '{{productId}}' }] }),
			req('Excel Download Many', 'GET', ['product', 'excel-download', 'many'], {
				query: [...PAGINATION, { key: 'pagination', value: 'false' }],
			}),
		]),

		folder('Client', [
			req('Find Many (optimized)', 'GET', ['client', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'search', value: '', disabled: true },
					{ key: 'debtType', value: 'gt', disabled: true, description: 'gt | lt | eq' },
					{ key: 'debtValue', value: '0', disabled: true },
					{ key: 'startDate', value: '2025-01-01', disabled: true },
					{ key: 'endDate', value: '2025-12-31', disabled: true },
				],
			}),
			req('Find Many Old', 'GET', ['client', 'many-old'], { query: [...PAGINATION] }),
			req('Find Many Report', 'GET', ['client', 'many', 'report'], {
				query: [...PAGINATION, { key: 'startDate', value: '', disabled: true }, { key: 'endDate', value: '', disabled: true }],
			}),
			req('Find One', 'GET', ['client', 'one'], {
				query: [
					{ key: 'id', value: '{{clientId}}' },
					{ key: 'deedStartDate', value: '', disabled: true },
					{ key: 'deedEndDate', value: '', disabled: true },
				],
			}),
			req('Create One', 'POST', ['client', 'one'], {
				body: jsonBody({ fullname: 'Alisher Nazarov', phone: '+998901234567', description: '' }),
			}),
			req('Update One', 'PATCH', ['client', 'one'], {
				query: [{ key: 'id', value: '{{clientId}}' }],
				body: jsonBody({ fullname: 'Yangilangan Ism' }),
			}),
			req('Delete One', 'DELETE', ['client', 'one'], {
				query: [
					{ key: 'id', value: '{{clientId}}' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['client', 'excel-download', 'many'], { query: [...PAGINATION] }),
			req('Excel Download One', 'GET', ['client', 'excel-download', 'one'], {
				query: [{ key: 'id', value: '{{clientId}}' }],
			}),
			req('Excel With Product Download One', 'GET', ['client', 'excel-with-product-download', 'one'], {
				query: [{ key: 'id', value: '{{clientId}}' }],
			}),
		]),

		folder('Supplier', [
			req('Find Many (optimized)', 'GET', ['supplier', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'search', value: '', disabled: true },
					{ key: 'debtType', value: 'gt', disabled: true },
					{ key: 'debtValue', value: '0', disabled: true },
				],
			}),
			req('Find Many Old', 'GET', ['supplier', 'many-old'], { query: [...PAGINATION] }),
			req('Find One', 'GET', ['supplier', 'one'], {
				query: [
					{ key: 'id', value: '{{supplierId}}' },
					{ key: 'deedStartDate', value: '', disabled: true },
					{ key: 'deedEndDate', value: '', disabled: true },
				],
			}),
			req('Create One', 'POST', ['supplier', 'one'], {
				body: jsonBody({ fullname: 'Hamkor Kompaniya', phone: '+998712345678' }),
			}),
			req('Update One', 'PATCH', ['supplier', 'one'], {
				query: [{ key: 'id', value: '{{supplierId}}' }],
				body: jsonBody({ fullname: 'Yangilangan' }),
			}),
			req('Delete One', 'DELETE', ['supplier', 'one'], {
				query: [
					{ key: 'id', value: '{{supplierId}}' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['supplier', 'excel-download', 'many'], { query: [...PAGINATION] }),
			req('Excel Download One', 'GET', ['supplier', 'excel-download', 'one'], {
				query: [{ key: 'id', value: '{{supplierId}}' }],
			}),
			req('Excel With Product Download One', 'GET', ['supplier', 'excel-with-product-download', 'one'], {
				query: [{ key: 'id', value: '{{supplierId}}' }],
			}),
		]),

		folder('Selling', [
			req('Find Many', 'GET', ['selling', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'clientId', value: '', disabled: true },
					{ key: 'staffId', value: '', disabled: true },
					{ key: 'status', value: 'accepted', disabled: true },
					{ key: 'search', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
			}),
			req('Find One', 'GET', ['selling', 'one'], { query: [{ key: 'id', value: '{{sellingId}}' }] }),
			req('Create One', 'POST', ['selling', 'one'], {
				body: jsonBody({
					clientId: '{{clientId}}',
					date: '2025-01-01T00:00:00.000Z',
					staffId: '{{staffId}}',
					send: false,
					description: '',
					payment: {
						paymentMethods: [{ type: 'cash', currencyId: '{{currencyId}}', amount: 100000 }],
						changeMethods: [],
						description: "Sotuv to'lovi",
					},
					products: [{ productId: '{{productId}}', count: 3, price: 25000, currencyId: '{{currencyId}}' }],
				}),
				description: 'Auth talab qilinadi',
			}),
			req('Update One', 'PATCH', ['selling', 'one'], {
				query: [{ key: 'id', value: '{{sellingId}}' }],
				body: jsonBody({ status: 'accepted', send: false }),
				description: 'Auth talab qilinadi',
			}),
			req('Delete One', 'DELETE', ['selling', 'one'], {
				query: [
					{ key: 'id', value: '{{sellingId}}' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['selling', 'excel-download', 'many'], { query: [...PAGINATION] }),
			req('Excel Download One', 'GET', ['selling', 'excel-download', 'one'], {
				query: [{ key: 'id', value: '{{sellingId}}' }],
			}),
		]),

		folder('Arrival', [
			req('Find Many', 'GET', ['arrival', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'supplierId', value: '', disabled: true },
					{ key: 'staffId', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
			}),
			req('Find One', 'GET', ['arrival', 'one'], { query: [{ key: 'id', value: 'ARRIVAL_UUID' }] }),
			req('Create One', 'POST', ['arrival', 'one'], {
				body: jsonBody({
					supplierId: '{{supplierId}}',
					date: '2025-01-01T00:00:00.000Z',
					payment: {
						paymentMethods: [{ type: 'cash', currencyId: '{{currencyId}}', amount: 100000 }],
					},
					products: [
						{
							productId: '{{productId}}',
							count: 10,
							cost: 5000,
							costCurrencyId: '{{currencyId}}',
							price: 8000,
							priceCurrencyId: '{{currencyId}}',
						},
					],
				}),
				description: 'Auth talab qilinadi',
			}),
			req('Update One', 'PATCH', ['arrival', 'one'], {
				query: [{ key: 'id', value: 'ARRIVAL_UUID' }],
				body: jsonBody({ productIdsToRemove: [] }),
				description: 'Auth talab qilinadi',
			}),
			req('Delete One', 'DELETE', ['arrival', 'one'], {
				query: [
					{ key: 'id', value: 'ARRIVAL_UUID' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['arrival', 'excel-download', 'many'], { query: [...PAGINATION] }),
			req('Excel Download One', 'GET', ['arrival', 'excel-download', 'one'], {
				query: [{ key: 'id', value: 'ARRIVAL_UUID' }],
			}),
		]),

		folder('Returning', [
			req('Find Many', 'GET', ['returning', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'clientId', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
			}),
			req('Find One', 'GET', ['returning', 'one'], { query: [{ key: 'id', value: 'RETURNING_UUID' }] }),
			req('Create One', 'POST', ['returning', 'one'], {
				body: jsonBody({
					clientId: '{{clientId}}',
					date: '2025-01-01T00:00:00.000Z',
					status: 'accepted',
					payment: {
						paymentMethods: [{ type: 'cash', currencyId: '{{currencyId}}', amount: 50000 }],
					},
					products: [{ productId: '{{productId}}', count: 2, price: 8000, currencyId: '{{currencyId}}' }],
				}),
			}),
			req('Update One', 'PATCH', ['returning', 'one'], {
				query: [{ key: 'id', value: 'RETURNING_UUID' }],
				body: jsonBody({ productIdsToRemove: [] }),
			}),
			req('Delete One', 'DELETE', ['returning', 'one'], {
				query: [
					{ key: 'id', value: 'RETURNING_UUID' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['returning', 'excel-download', 'many'], { query: [...PAGINATION] }),
			req('Excel Download One', 'GET', ['returning', 'excel-download', 'one'], {
				query: [{ key: 'id', value: 'RETURNING_UUID' }],
			}),
		]),

		folder('Client Payment', [
			req('Find Many (optimized)', 'GET', ['client-payment', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'clientId', value: '', disabled: true },
					{ key: 'staffId', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
			}),
			req('Find Many Old', 'GET', ['client-payment', 'many-old'], { query: [...PAGINATION] }),
			req('Find One', 'GET', ['client-payment', 'one'], { query: [{ key: 'id', value: 'CLIENT_PAYMENT_UUID' }] }),
			req('Create One', 'POST', ['client-payment', 'one'], {
				body: jsonBody({
					clientId: '{{clientId}}',
					description: "To'lov",
					paymentMethods: [{ type: 'cash', currencyId: '{{currencyId}}', amount: 500000 }],
					changeMethods: [],
				}),
				description: 'Auth talab qilinadi',
			}),
			req('Update One', 'PATCH', ['client-payment', 'one'], {
				query: [{ key: 'id', value: 'CLIENT_PAYMENT_UUID' }],
				body: jsonBody({ description: 'Yangilangan' }),
			}),
			req('Delete One', 'DELETE', ['client-payment', 'one'], {
				query: [
					{ key: 'id', value: 'CLIENT_PAYMENT_UUID' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['client-payment', 'excel-download', 'many'], { query: [...PAGINATION] }),
		]),

		folder('Supplier Payment', [
			req('Find Many', 'GET', ['supplier-payment', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'supplierId', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
			}),
			req('Find Many New (optimized)', 'GET', ['supplier-payment', 'many-new'], {
				query: [...PAGINATION],
				description: 'Optimallashtirilgan versiya',
			}),
			req('Find One', 'GET', ['supplier-payment', 'one'], { query: [{ key: 'id', value: 'SUPPLIER_PAYMENT_UUID' }] }),
			req('Create One', 'POST', ['supplier-payment', 'one'], {
				body: jsonBody({
					supplierId: '{{supplierId}}',
					description: "To'lov",
					paymentMethods: [{ type: 'cash', currencyId: '{{currencyId}}', amount: 500000 }],
				}),
				description: 'Auth talab qilinadi',
			}),
			req('Update One', 'PATCH', ['supplier-payment', 'one'], {
				query: [{ key: 'id', value: 'SUPPLIER_PAYMENT_UUID' }],
				body: jsonBody({ description: 'Yangilangan' }),
			}),
			req('Delete One', 'DELETE', ['supplier-payment', 'one'], {
				query: [
					{ key: 'id', value: 'SUPPLIER_PAYMENT_UUID' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['supplier-payment', 'excel-download', 'many'], { query: [...PAGINATION] }),
		]),

		folder('Staff Payment', [
			req('Find Many', 'GET', ['staff-payment', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'staffId', value: '', disabled: true },
					{ key: 'employeeId', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
			}),
			req('Find One', 'GET', ['staff-payment', 'one'], { query: [{ key: 'id', value: 'STAFF_PAYMENT_UUID' }] }),
			req('Create One', 'POST', ['staff-payment', 'one'], {
				body: jsonBody({
					employeeId: '{{staffId}}',
					description: 'Oylik maosh',
					method: { currencyId: '{{currencyId}}', amount: 3000000 },
				}),
				description: 'Auth talab qilinadi. Body: `method` (bitta object), `employeeId`',
			}),
			req('Update One', 'PATCH', ['staff-payment', 'one'], {
				query: [{ key: 'id', value: 'STAFF_PAYMENT_UUID' }],
				body: jsonBody({ description: 'Yangilangan', method: { currencyId: '{{currencyId}}', amount: 3500000 } }),
			}),
			req('Delete One', 'DELETE', ['staff-payment', 'one'], {
				query: [
					{ key: 'id', value: 'STAFF_PAYMENT_UUID' },
					{ key: 'method', value: 'soft' },
				],
			}),
			req('Excel Download Many', 'GET', ['staff-payment', 'excel-download', 'many'], { query: [...PAGINATION] }),
		]),

		folder('Selling Product MV', [
			req('Find Many', 'GET', ['selling-product-mv', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'sellingId', value: '', disabled: true },
					{ key: 'productId', value: '', disabled: true },
					{ key: 'staffId', value: '', disabled: true },
				],
			}),
			req('Find One', 'GET', ['selling-product-mv', 'one'], { query: [{ key: 'id', value: 'MV_UUID' }] }),
			req('Create One', 'POST', ['selling-product-mv', 'one'], {
				body: jsonBody({
					sellingId: '{{sellingId}}',
					productId: '{{productId}}',
					count: 2,
					price: 25000,
					currencyId: '{{currencyId}}',
				}),
				description: 'Auth talab qilinadi',
			}),
			req('Update One', 'PATCH', ['selling-product-mv', 'one'], {
				query: [{ key: 'id', value: 'MV_UUID' }],
				body: jsonBody({ count: 4 }),
				description: 'Auth talab qilinadi',
			}),
			req('Delete One', 'DELETE', ['selling-product-mv', 'one'], { query: [{ key: 'id', value: 'MV_UUID' }] }),
		]),

		folder('Arrival Product MV', [
			req('Find Many', 'GET', ['arrival-product-mv', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'arrivalId', value: '', disabled: true },
					{ key: 'productId', value: '', disabled: true },
				],
			}),
			req('Find One', 'GET', ['arrival-product-mv', 'one'], { query: [{ key: 'id', value: 'MV_UUID' }] }),
			req('Create One', 'POST', ['arrival-product-mv', 'one'], {
				body: jsonBody({
					arrivalId: 'ARRIVAL_UUID',
					productId: '{{productId}}',
					count: 5,
					cost: 5000,
					costCurrencyId: '{{currencyId}}',
					price: 8000,
					priceCurrencyId: '{{currencyId}}',
				}),
				description: 'Auth talab qilinadi',
			}),
			req('Update One', 'PATCH', ['arrival-product-mv', 'one'], {
				query: [{ key: 'id', value: 'MV_UUID' }],
				body: jsonBody({ count: 8 }),
				description: 'Auth talab qilinadi',
			}),
			req('Delete One', 'DELETE', ['arrival-product-mv', 'one'], { query: [{ key: 'id', value: 'MV_UUID' }] }),
		]),

		folder('Returning Product MV', [
			req('Find Many', 'GET', ['returning-product-mv', 'many'], {
				query: [
					...PAGINATION,
					{ key: 'returningId', value: '', disabled: true },
					{ key: 'productId', value: '', disabled: true },
				],
			}),
			req('Find One', 'GET', ['returning-product-mv', 'one'], { query: [{ key: 'id', value: 'MV_UUID' }] }),
			req('Create One', 'POST', ['returning-product-mv', 'one'], {
				body: jsonBody({
					returningId: 'RETURNING_UUID',
					productId: '{{productId}}',
					count: 2,
					price: 8000,
					currencyId: '{{currencyId}}',
				}),
				description: 'Auth talab qilinadi',
			}),
			req('Update One', 'PATCH', ['returning-product-mv', 'one'], {
				query: [{ key: 'id', value: 'MV_UUID' }],
				body: jsonBody({ count: 3 }),
				description: 'Auth talab qilinadi',
			}),
			req('Delete One', 'DELETE', ['returning-product-mv', 'one'], { query: [{ key: 'id', value: 'MV_UUID' }] }),
		]),

		folder('Statistics', [
			req('Selling Period Stats', 'GET', ['statistics', 'selling', 'period'], {
				query: [{ key: 'type', value: 'day', description: 'day | week | month | year' }],
				auth: { type: 'noauth' },
			}),
			req('Selling Total Stats', 'GET', ['statistics', 'selling', 'total'], {
				query: [],
				auth: { type: 'noauth' },
				description: 'Kun/hafta/oy/yil + client/supplier debt totals',
			}),
			req('Product MV (all types)', 'GET', ['statistics', 'product-mv'], {
				query: [
					...PAGINATION,
					{ key: 'type', value: 'selling', disabled: true, description: 'selling | arrival | returning' },
					{ key: 'productId', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
			}),
			req('Many Product Stats', 'GET', ['statistics', 'many-product-stats'], {
				query: [
					{ key: 'productId', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
				auth: { type: 'noauth' },
				description: 'Service ichida pagination: false — barcha mahsulotlar',
			}),
			req('Client Report', 'GET', ['statistics', 'client-report'], {
				query: [
					...PAGINATION,
					{ key: 'search', value: '', disabled: true },
					{ key: 'startDate', value: '', disabled: true },
					{ key: 'endDate', value: '', disabled: true },
				],
				auth: { type: 'noauth' },
			}),
			req('Dashboard Summary', 'GET', ['statistics', 'dashboard-summary'], {
				query: [
					{ key: 'startDate', value: '2025-01-01', disabled: true },
					{ key: 'endDate', value: '2025-12-31', disabled: true },
				],
				auth: { type: 'noauth' },
				description: 'Umumiy dashboard: sotuv, qaytarish, to‘lovlar',
			}),
		]),

		folder('Upload', [
			req('Upload Supplier Excel', 'POST', ['upload', 'supplier'], {
				query: [
					{ key: 'mode', value: 'append', description: 'append | overwrite' },
					{ key: 'type', value: 'jas', description: 'jas | kas' },
				],
				header: [],
				body: {
					mode: 'formdata',
					formdata: [{ key: 'file', type: 'file', src: [] }],
				},
				description: 'multipart/form-data — Excel fayl',
			}),
			req('Upload Client Excel', 'POST', ['upload', 'client'], {
				query: [
					{ key: 'mode', value: 'append' },
					{ key: 'type', value: 'jas' },
				],
				header: [],
				body: {
					mode: 'formdata',
					formdata: [{ key: 'file', type: 'file', src: [] }],
				},
			}),
			req('Upload Product Excel', 'POST', ['upload', 'product'], {
				query: [
					{ key: 'mode', value: 'append' },
					{ key: 'type', value: 'jas' },
				],
				header: [],
				body: {
					mode: 'formdata',
					formdata: [{ key: 'file', type: 'file', src: [] }],
				},
			}),
		]),
	],
}

writeFileSync(OUT, JSON.stringify(collection, null, 2) + '\n')
console.log(`Written: ${OUT}`)
console.log(`Folders: ${collection.item.length}`)
console.log(`Requests: ${collection.item.reduce((n, f) => n + f.item.length, 0)}`)
