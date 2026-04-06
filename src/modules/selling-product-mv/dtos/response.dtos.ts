import { GlobalResponse, PaginationResponse } from '@common'

export class SellingProductMVFindManyResponseDto implements GlobalResponse {
	success: any
	data: any
}

export class SellingProductMVFindOneResponseDto implements GlobalResponse {
	success: any
	data: any
}

export class SellingProductMVModifyResponseDto implements GlobalResponse {
	success: any
	data: null
}
