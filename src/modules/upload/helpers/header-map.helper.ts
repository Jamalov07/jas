export const STAFF_EXCEL_MAP = {
	ID: 'id',
	Ismi: 'fullname',
	'Telefon raqami': 'phone',
	Role: 'role',
	"Ro'yxatdan o'tgan sana": 'createdAt',
} as const

export const SUPPLIER_EXCEL_MAP = {
	ID: 'id',
	Ismi: 'fullname',
	'Telefon raqami': 'phone',
	Qarzi: 'debt',
	"Ro'yxatdan o'tgan sana": 'createdAt',
} as const

export const CLIENT_EXCEL_MAP = {
	ID: 'id',
	Ismi: 'fullname',
	'Telefon raqami': 'phone',
	Qarzi: 'debt',
	"Ro'yxatdan o'tgan sana": 'createdAt',
} as const

export const PRODUCT_EXCEL_MAP = {
	ID: 'id',
	Nomi: 'name',
	Miqdori: 'count',
	'Minimal miqdor': 'minAmount',
	'Sotish narxi': 'price',
	Narxi: 'cost',
	'Yaratilgan sana': 'createdAt',
} as const
