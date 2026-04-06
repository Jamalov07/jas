import { ClientPaymentModel } from '@prisma/client'
import { DefaultRequiredFields } from '../../../common'

export declare interface ClientPaymentRequired extends DefaultRequiredFields, Required<Pick<ClientPaymentModel, 'staffId' | 'description' | 'clientId'>> {}

export declare interface ClientPaymentOptional extends Partial<ClientPaymentRequired> {}

export declare interface ClientPaymentMethod {
	type: string
	currencyId: string
	amount: import('@prisma/client/runtime/library').Decimal
}
