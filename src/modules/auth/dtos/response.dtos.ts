import { ApiProperty, IntersectionType } from '@nestjs/swagger'
import { Tokens, StaffSignInData, StaffSignInResponse } from '../interfaces'
import { StaffOptional, StaffOptionalDto } from '../../staff'
import { GlobalModifyResponseDto, GlobalResponseDto } from '@common'

export class TokensDto implements Tokens {
	@ApiProperty({ type: String })
	accessToken: string

	@ApiProperty({ type: String })
	refreshToken: string
}

export class StaffSignInDataDto implements StaffSignInData {
	@ApiProperty({ type: StaffOptionalDto })
	staff: StaffOptional

	@ApiProperty({ type: TokensDto })
	tokens: Tokens
}

export class StaffSignInResponseDto extends GlobalResponseDto implements StaffSignInResponse {
	@ApiProperty({ type: StaffSignInDataDto })
	data: StaffSignInData
}

export class AuthModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) {}
