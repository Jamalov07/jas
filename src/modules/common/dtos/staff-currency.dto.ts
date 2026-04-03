import { ApiProperty, IntersectionType } from '@nestjs/swagger'
import { GlobalModifyResponseDto, GlobalResponseDto } from '../../../common'
import { StaffUpdateCurrencyRequest, StaffUpdateCurrencyResponse } from '../interfaces'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class StaffUpdateCurrencyRequestDto implements StaffUpdateCurrencyRequest {
	@ApiProperty({ type: String, example: '00097072-f510-4ded-a18f-976d7fa2e024' })
	@IsNotEmpty()
	@IsUUID('4')
	currencyId: string
}

export class StaffUpdateCurrencyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements StaffUpdateCurrencyResponse {}
