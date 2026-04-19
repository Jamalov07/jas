import { ProductModel } from '@prisma/client'

export declare interface ProductRequired extends Omit<Required<ProductModel>, 'image'> {
	image?: any
}

export declare interface ProductOptional extends Omit<Partial<ProductModel>, 'image'> {
	image?: any
}
