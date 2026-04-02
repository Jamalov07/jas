import { IntersectionType, PickType } from '@nestjs/swagger'
import { StaffSignInRequest } from '../interfaces'
import { StaffRequiredDto } from '../../staff'

export class StaffSignInRequestDto extends IntersectionType(PickType(StaffRequiredDto, ['password', 'phone'])) implements StaffSignInRequest {}
