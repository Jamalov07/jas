import { PaymentModel } from '@prisma/client'
import { DefaultRequiredFields } from '../../../common'

export declare interface StaffPaymentRequired extends DefaultRequiredFields, Required<Pick<PaymentModel, 'sum' | 'staffId' | 'description' | 'userId' | 'total'>> {}

export declare interface StaffPaymentOptional extends Partial<StaffPaymentRequired> {}
