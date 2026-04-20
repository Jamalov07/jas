/** Shared GET routes that should return 200 + global JSON envelope (no auth). */

export const LIST_QUERY = { pageNumber: 1, pageSize: 5, pagination: 'true' as const }

export const E2E_PUBLIC_GET_JSON_ROUTES: { path: string; query?: Record<string, string | number | boolean> }[] = [
	{ path: '/action/many', query: LIST_QUERY },
	{ path: '/currency/many', query: LIST_QUERY },
	{ path: '/permission/many', query: LIST_QUERY },
	{ path: '/product/many', query: LIST_QUERY },
	{ path: '/staff/many', query: LIST_QUERY },
	{ path: '/client/many', query: LIST_QUERY },
	{ path: '/client/many/report', query: LIST_QUERY },
	{ path: '/supplier/many', query: LIST_QUERY },
	{ path: '/arrival/many', query: LIST_QUERY },
	{ path: '/selling/many', query: LIST_QUERY },
	{ path: '/returning/many', query: LIST_QUERY },
	{ path: '/client-payment/many', query: LIST_QUERY },
	{ path: '/supplier-payment/many', query: LIST_QUERY },
	{ path: '/staff-payment/many', query: LIST_QUERY },
	{ path: '/selling-product-mv/many', query: LIST_QUERY },
	{ path: '/arrival-product-mv/many', query: LIST_QUERY },
	{ path: '/returning-product-mv/many', query: LIST_QUERY },
	{ path: '/statistics/selling/period', query: { type: 'day' } },
	{ path: '/statistics/selling/total', query: {} },
	{ path: '/statistics/product-mv', query: LIST_QUERY },
	{ path: '/statistics/many-product-stats', query: LIST_QUERY },
	{ path: '/statistics/client-report', query: LIST_QUERY },
	{ path: '/statistics/dashboard-summary', query: LIST_QUERY },
	{ path: '/common/day-close', query: {} },
]

export const E2E_PUBLIC_GET_EXCEL_MANY_ROUTES: string[] = [
	'/client/excel-download/many',
	'/supplier/excel-download/many',
	'/arrival/excel-download/many',
	'/selling/excel-download/many',
	'/returning/excel-download/many',
	'/client-payment/excel-download/many',
	'/supplier-payment/excel-download/many',
	'/staff-payment/excel-download/many',
	'/product/excel-download/many',
]
