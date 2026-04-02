import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common'
import { StaffOptional } from '../../modules/staff'
import { PrismaService } from '../../modules/shared/prisma'
import { Request } from 'express'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Reflector } from '@nestjs/core'
import { cyan } from 'colors'
import { ERROR_MSG } from '../constants'

@Injectable()
export class AuthGuard implements CanActivate {
	private readonly logger = new Logger(AuthGuard.name)

	constructor(
		private readonly prisma: PrismaService,
		private readonly jwtService: JwtService,
		private readonly configService: ConfigService,
		private readonly reflector: Reflector,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (context['contextType'] === 'telegraf') {
			return true
		}

		const authOptions = this.reflector.get<{ isAuthRequired: boolean; isStaffRequired: boolean }>('authOptions', context.getHandler())
		const isAuthRequired = authOptions?.isAuthRequired
		const isStaffRequired = authOptions?.isStaffRequired

		const request = context.switchToHttp().getRequest<Request>()

		const token = this.extractTokenFromHeader(request, isAuthRequired)

		if (isStaffRequired) {
			if (!token) {
				throw new UnauthorizedException(ERROR_MSG.AUTH.TOKEN_NOT_PROVIDED.UZ)
			} else {
				const user = await this.parseTokenWithJwt(token, isStaffRequired)
				request['user'] = user
				this.logger.debug(cyan(request['user']))

				return true
			}
		} else {
			if (!token) {
				return true
			} else {
				const user = await this.parseTokenWithJwt(token, isStaffRequired)
				if (Object.keys(user).length) {
					request['user'] = user
				}
				this.logger.debug(cyan(request['user']))

				return true
			}
		}
	}
	private extractTokenFromHeader(request: Request, isAuthRequired: boolean): string | undefined {
		const authorizationHeader = request.headers.authorization

		if (isAuthRequired) {
			if (!authorizationHeader) {
				throw new UnauthorizedException(ERROR_MSG.AUTH.AUTHORIZATION_NOT_PROVIDED.UZ)
			}

			const [type, token] = authorizationHeader.split(' ') ?? []
			return type === 'Bearer' ? token : undefined
		} else {
			if (authorizationHeader) {
				const [type, token] = authorizationHeader.split(' ') ?? []
				return type === 'Bearer' ? token : undefined
			}
			return undefined
		}
	}

	private async parseTokenWithJwt(token: string, isStaffRequired: boolean) {
		try {
			const payload = await this.jwtService.verifyAsync(token, { secret: this.configService.get('jwt.accessToken.key') })

			if (!payload || !payload?.id) {
				if (isStaffRequired) {
					throw new UnauthorizedException(ERROR_MSG.AUTH.INVALID_TOKEN.UZ)
				}
			}
			let user: Partial<StaffOptional>
			if (payload?.id) {
				user = await this.prisma.userModel.findFirst({ where: { id: payload?.id } })
			}

			if (isStaffRequired) {
				if (!user) {
					throw new UnauthorizedException(ERROR_MSG.AUTH.USER_NOT_FOUND_WITH_THIS_TOKEN.UZ)
				}
				if (user.deletedAt) {
					throw new UnauthorizedException(ERROR_MSG.AUTH.USER_WAS_DELETED.UZ)
				}
			}

			return { id: user?.id }
		} catch (e) {
			if (isStaffRequired) {
				throw new UnauthorizedException(e?.message || e)
			} else {
				return {}
			}
		}
	}
}
