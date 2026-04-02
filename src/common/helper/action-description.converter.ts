const ACTION_DESCRIPTIONS = {
	//staff
	'staff/many-findMany-get': `Xodimlarning to'liq ro'yxatini olish`,
	'staff/one-findOne-get': `Bitta xodimni olish`,
	'staff/one-createOne-post': `Yangi xodim yaratish`,
	'staff/one-updateOne-patch': `Xodimni yangilash`,
	'staff/one-deleteOne-delete': `Xodimni o'chirish`,

	//action
	'action/many-findMany-get': `Harakatlar ro'yxatini olish`,
	'action/one-findOne-get': `Bitta harakatni olish`,
	'action/one-updateOne-patch': `Harakatni yangilash`,
}

export function actionDescriptionConverter(action: string): string {
	return ACTION_DESCRIPTIONS[action] ?? `Noma'lum harakat`
}
