import { GlobalResponse } from '@common'
import { StaffOptional } from '../../staff'

export declare interface Tokens {
	accessToken: string
	refreshToken: string
}

export declare interface StaffSignInData {
	staff: StaffOptional
	tokens: Tokens
}

export declare interface StaffSignInResponse extends GlobalResponse {
	data: StaffSignInData
}
