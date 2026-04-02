import { UserModel } from '@prisma/client'

export declare interface ClientRequired extends Required<UserModel> {}

export declare interface ClientOptional extends Partial<UserModel> {}
