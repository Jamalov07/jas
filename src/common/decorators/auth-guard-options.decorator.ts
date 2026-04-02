import { SetMetadata } from '@nestjs/common'

export const AuthOptions = (isAuthRequired: boolean = false, isStaffRequired: boolean = false) => SetMetadata('authOptions', { isAuthRequired, isStaffRequired })
