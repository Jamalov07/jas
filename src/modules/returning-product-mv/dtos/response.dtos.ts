import { GlobalResponse } from '@common'

export class ReturningProductMVFindManyResponseDto implements GlobalResponse {
	success: any
	data: any
}

export class ReturningProductMVFindOneResponseDto implements GlobalResponse {
	success: any
	data: any
}

export class ReturningProductMVModifyResponseDto implements GlobalResponse {
	success: any
	data: null
}
