import { ChangeMethodEnum, ClientPaymentModel, PaymentMethodEnum } from '@prisma/client'
import { DefaultRequiredFields } from '../../../common'

export declare interface ClientPaymentRequired extends DefaultRequiredFields, Required<Pick<ClientPaymentModel, 'staffId' | 'description' | 'clientId'>> {}

export declare interface ClientPaymentOptional extends Partial<ClientPaymentRequired> {}

export declare interface ClientPaymentMethod {
	type: PaymentMethodEnum
	currencyId: string
	amount: import('@prisma/client/runtime/library').Decimal
}

export declare interface ClientPaymentChangeMethod {
	type: ChangeMethodEnum
	currencyId: string
	amount: import('@prisma/client/runtime/library').Decimal
}
