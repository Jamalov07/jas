import { ProductModel } from '@prisma/client'

export declare interface ProductRequired extends Required<ProductModel> {}

export declare interface ProductOptional extends Partial<ProductModel> {}
