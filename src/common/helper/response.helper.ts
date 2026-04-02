import { GlobalResponse } from '../interfaces'

export function createResponse<T>(resData: GlobalResponse & { data?: T }) {
	return {
		data: resData.data,
		status: resData.status ?? 200,
		success: {
			is: resData.success?.is ?? true,
			messages: resData.success?.messages ?? [],
		},
		error: {
			is: resData.error?.is ?? false,
			messages: resData.error?.messages ?? [],
		},
		warning: {
			is: resData.warning?.is ?? false,
			messages: resData.warning?.messages ?? [],
		},
	}
}

export function createSuccessResponse<T>(data: T): GlobalResponse & { data: T } {
	return {
		data: data,
		status: 200,
		success: { is: true, messages: [] },
		error: { is: false, messages: [] },
		warning: { is: false, messages: [] },
	}
}
