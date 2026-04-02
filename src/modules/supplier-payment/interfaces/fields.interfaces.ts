import { PaymentModel } from '@prisma/client'
import { DefaultRequiredFields } from '../../../common'

export declare interface SupplierPaymentRequired
	extends DefaultRequiredFields,
		Required<Pick<PaymentModel, 'staffId' | 'description' | 'userId' | 'card' | 'cash' | 'other' | 'transfer' | 'total'>> {}

export declare interface SupplierPaymentOptional extends Partial<SupplierPaymentRequired> {}
