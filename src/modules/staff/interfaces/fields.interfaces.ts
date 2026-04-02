import { UserModel } from '@prisma/client'

export declare interface StaffRequired extends Required<UserModel> {}

export declare interface StaffOptional extends Partial<UserModel> {}
