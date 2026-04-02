export const ERROR_MSG = {
	ACTION: {
		NOT_FOUND: {
			EN: 'action not found',
			RU: 'action not found',
			UZ: 'harakat topilmadi',
		},
	},
	ARRIVAL: {
		NOT_FOUND: {
			EN: 'arrival not found',
			RU: 'arrival not found',
			UZ: 'tushurilish topilmadi',
		},
	},
	AUTH: {
		UNAUTHORIZED: {
			EN: 'staff unauthorized',
			RU: 'staff unauthorized',
			UZ: "xodim ro'yhatdan o'tmagan",
		},
		TOKEN_NOT_PROVIDED: {
			EN: 'token not provided',
			RU: 'token not provided',
			UZ: 'token yuborilmagan',
		},
		INVALID_TOKEN: {
			EN: 'invalid token',
			RU: 'invalid token',
			UZ: 'yaroqsiz token',
		},
		USER_WAS_DELETED: {
			EN: 'user was deleted',
			RU: 'user was deleted',
			UZ: "foydalanuvchi o'chirilgan",
		},
		USER_NOT_FOUND_WITH_THIS_TOKEN: {
			EN: 'user not found with this token',
			RU: 'user not found with this token',
			UZ: 'bu token bilan foydalanuvchi topilmadi',
		},
		AUTHORIZATION_NOT_PROVIDED: {
			EN: 'authorization not provided',
			RU: 'authorization not provided',
			UZ: "ro'yhatdan o'tganlik yuborilmagan",
		},
		DELETED: {
			EN: 'staff was deleted',
			RU: 'staff was deleted',
			UZ: "xodim o'chirilgan",
		},
		WRONG_PASSWORD: {
			EN: 'wrong password',
			RU: 'wrong password',
			UZ: 'parol xato',
		},
		TOKEN_VALIDATION_FAILED: {
			EN: 'token validation failed',
			RU: 'token validation failed',
			UZ: 'token tekshirishda xatolik yuz berdi',
		},
		INVALID_TOKEN_PAYLOAD: {
			EN: 'invalid token payload',
			RU: 'invalid token payload',
			UZ: "yaroqsiz token ma'lumoti",
		},
		INVALID_TOKEN_FORMAT: {
			EN: 'invalid token format',
			RU: 'invalid token format',
			UZ: 'yaroqsiz token formati',
		},
		INVALID_AUTH_TYPE: {
			EN: 'invalid auth type',
			RU: 'invalid auth type',
			UZ: "yaroqsiz ro'yhatdan o'tganlik turi",
		},
		AUTH_HEADER_NOT_PROVIDED: {
			EN: 'authorization header not provided',
			RU: 'authorization header not provided',
			UZ: "ro'yhatdan o'tganlik yuborilmagan",
		},
		PERMISSION_NOT_GRANTED: {
			EN: 'permission not granted',
			RU: 'permission not granted',
			UZ: 'ruxsat berilmagan',
		},
	},
	NOT_FOUND: (t: string) => ({
		EN: `Cannot_ ${t}`,
		RU: `Cannot_ ${t}`,
		UZ: `Olish ilojsiz_ ${t}`,
	}),
	HTTP_METHOD_METADATA_NOT_FOUND: {
		EN: 'HTTP method metadata not found',
		RU: 'HTTP method metadata not found',
		UZ: 'HTTP usul topilmadi',
	},
	GUARD_USER_NOT_FOUND: {
		EN: 'check permission guard: user not found',
		RU: 'check permission guard: user not found',
		UZ: 'ruxsat tekshiruvchi: foydalanuvchi topilmadi',
	},
	STAFF: {
		NOT_FOUND: {
			EN: 'staff not found',
			RU: 'staff not found',
			UZ: 'xodim topilmadi',
		},
		PHONE_EXISTS: {
			EN: 'phone already exists',
			RU: 'phone already exists',
			UZ: 'raqam allaqachon mavjud',
		},
	},
	SUPPLIER: {
		NOT_FOUND: {
			EN: 'supplier not found',
			RU: 'supplier not found',
			UZ: 'yetkazib beruvchi topilmadi',
		},
		PHONE_EXISTS: {
			EN: 'phone already exists',
			RU: 'phone already exists',
			UZ: 'raqam allaqachon mavjud',
		},
	},
	CLIENT: {
		NOT_FOUND: {
			EN: 'client not found',
			RU: 'client not found',
			UZ: 'xaridor topilmadi',
		},
		PHONE_EXISTS: {
			EN: 'phone already exists',
			RU: 'phone already exists',
			UZ: 'raqam allaqachon mavjud',
		},
	},
	CLIENT_PAYMENT: {
		NOT_FOUND: {
			EN: 'client payment not found',
			RU: 'client payment not found',
			UZ: "xaridor to'lovi topilmadi",
		},
	},
	DAY_CLOSE: {
		CLOSED: {
			EN: 'the day already closed',
			RU: 'the day already closed',
			UZ: 'kun allaqachon yopilgan',
		},
	},
	PERMISSION: {
		NOT_FOUND: {
			EN: 'permission not found',
			RU: 'permission not found',
			UZ: 'ruxsat topilmadi',
		},
		NAME_EXISTS: {
			EN: 'name already exists',
			RU: 'name already exists',
			UZ: 'nom allaqachon mavjud',
		},
	},
	PRODUCT: {
		NOT_FOUND: {
			EN: 'product not found',
			RU: 'product not found',
			UZ: 'mahsulot topilmadi',
		},
		NAME_EXISTS: {
			EN: 'name already exists',
			RU: 'name already exists',
			UZ: 'nom allaqachon mavjud',
		},
	},
	PRODUCT_MV: {
		NOT_FOUND: {
			EN: 'product mv not found',
			RU: 'product mv not found',
			UZ: 'mahsulot mv topilmadi',
		},
	},
	PRODUCT_PRICE: {
		NOT_FOUND: {
			EN: 'product price not found',
			RU: 'product price not found',
			UZ: 'mahsulot narxi topilmadi',
		},
		TYPE_EXISTS: {
			EN: 'price type already exists for this product',
			RU: 'price type already exists for this product',
			UZ: 'bu mahsulot uchun narx turi allaqachon mavjud',
		},
	},
	CURRENCY: {
		NOT_FOUND: {
			EN: 'currency not found',
			RU: 'currency not found',
			UZ: 'valyuta topilmadi',
		},
		NAME_EXISTS: {
			EN: 'currency name already exists',
			RU: 'currency name already exists',
			UZ: 'valyuta nomi allaqachon mavjud',
		},
	},
	RETURNING: {
		NOT_FOUND: {
			EN: 'returning not found',
			RU: 'returning not found',
			UZ: 'qaytarilish topilmadi',
		},
	},
	SELLING: {
		NOT_FOUND: {
			EN: 'selling not found',
			RU: 'selling not found',
			UZ: 'sotuv topilmadi',
		},
	},
	STAFF_PAYMENT: {
		NOT_FOUND: {
			EN: 'staff payment not found',
			RU: 'staff payment not found',
			UZ: "xodim to'lovi topilmadi",
		},
	},
	SUPPLIER_PAYMENT: {
		NOT_FOUND: {
			EN: 'supplier payment not found',
			RU: 'supplier payment not found',
			UZ: "yetkazib beruvchi to'lovi topilmadi",
		},
	},
	INTERNAL_SERVER_ERROR: {
		EN: 'internal server error',
		RU: 'internal server error',
		UZ: "tizimda noma'lum xatolik",
	},
}
