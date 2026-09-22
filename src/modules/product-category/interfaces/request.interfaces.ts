import { PaginationRequest, RequestOtherFields } from '@common'
import { ProductCategoryOptional, ProductCategoryRequired } from './fields.interfaces'

export declare interface ProductCategoryFindManyRequest
	extends Pick<ProductCategoryOptional, 'name'>,
		PaginationRequest,
		Pick<RequestOtherFields, 'search'> {}

export declare interface ProductCategoryFindOneRequest extends Pick<ProductCategoryRequired, 'id'> {}

export declare interface ProductCategoryGetOneRequest extends ProductCategoryOptional {}

export declare interface ProductCategoryCreateOneRequest extends Pick<ProductCategoryRequired, 'name'> {}

export declare interface ProductCategoryUpdateOneRequest extends Pick<ProductCategoryOptional, 'name'> {}

export declare interface ProductCategoryDeleteOneRequest extends Pick<ProductCategoryOptional, 'id'> {}
