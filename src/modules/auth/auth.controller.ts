import { Body, Controller, Get, Post, Req, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { AuthModifyResponseDto, StaffSignInRequestDto, StaffSignInResponseDto } from './dtos'
import { CRequest, AuthOptions, RefreshTokenInterceptor, CheckPermissionGuard } from '@common'
import { StaffFindOneResponseDto } from '../staff'

@Controller('auth')
@ApiTags('Auth')
@UseGuards(CheckPermissionGuard)
export class AuthController {
	private readonly authService: AuthService
	constructor(authService: AuthService) {
		this.authService = authService
	}

	@Get('profile')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'staff profile' })
	@ApiOkResponse({ type: StaffFindOneResponseDto })
	async getStaffProfile(@Req() request: CRequest): Promise<StaffFindOneResponseDto> {
		return this.authService.getStaffProfile({ user: request.user })
	}

	@Post('sign-in')
	@ApiOperation({ summary: 'sign in staff' })
	@ApiOkResponse({ type: StaffSignInResponseDto })
	async signIn(@Body() body: StaffSignInRequestDto): Promise<StaffSignInResponseDto> {
		return this.authService.signIn(body)
	}

	@Post('sign-out')
	@AuthOptions(true, true)
	@ApiOperation({ summary: 'sign out staff' })
	@ApiOkResponse({ type: AuthModifyResponseDto })
	async signOut(@Req() request: CRequest): Promise<AuthModifyResponseDto> {
		return this.authService.signOut({ user: request.user })
	}

	@Post('refresh-token')
	@ApiOperation({ summary: 'refresh token' })
	@ApiOkResponse({ type: StaffSignInResponseDto })
	@UseInterceptors(RefreshTokenInterceptor)
	async getValidTokensWithRefresh(@Req() request: CRequest) {
		return this.authService.getValidTokens({ user: request.user })
	}
}
