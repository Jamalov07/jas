import { ChangeMethodEnum, PaymentMethodEnum, SupplierPaymentModel } from '@prisma/client'
import { DefaultRequiredFields } from '../../../common'

export declare interface SupplierPaymentRequired extends DefaultRequiredFields, Required<Pick<SupplierPaymentModel, 'staffId' | 'description' | 'supplierId'>> {}

export declare interface SupplierPaymentOptional extends Partial<SupplierPaymentRequired> {}

export declare interface SupplierPaymentMethod {
	type: PaymentMethodEnum
	currencyId: string
	amount: import('@prisma/client/runtime/library').Decimal
}

export declare interface SupplierPaymentChangeMethod {
	type: ChangeMethodEnum
	currencyId: string
	amount: import('@prisma/client/runtime/library').Decimal
}
