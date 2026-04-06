import { StaffPaymentModel } from '@prisma/client'
import { DefaultRequiredFields } from '../../../common'

export declare interface StaffPaymentRequired extends DefaultRequiredFields, Required<Pick<StaffPaymentModel, 'staffId' | 'description' | 'employeeId'>> {}

export declare interface StaffPaymentOptional extends Partial<StaffPaymentRequired> {}

export declare interface StaffPaymentMethod {
	type: string
	currencyId: string
	amount: import('@prisma/client/runtime/library').Decimal
}
