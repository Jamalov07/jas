export function deletedAtConverter(isDeleted?: boolean) {
	return isDeleted === true ? { not: null } : isDeleted === false ? null : undefined
}
