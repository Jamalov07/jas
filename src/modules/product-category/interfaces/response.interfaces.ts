import { GlobalResponse, PaginationResponse } from '@common'
import { ProductCategoryRequired } from './fields.interfaces'

export declare interface ProductCategoryFindManyData extends PaginationResponse<ProductCategoryFindOneData> {}

export declare interface ProductCategoryFindOneData extends Pick<ProductCategoryRequired, 'id' | 'name' | 'createdAt'> {}

export declare interface ProductCategoryFindManyResponse extends GlobalResponse {
	data: ProductCategoryFindManyData
}

export declare interface ProductCategoryFindOneResponse extends GlobalResponse {
	data: ProductCategoryFindOneData
}

export declare interface ProductCategoryModifyResponse extends GlobalResponse {
	data: null
}
