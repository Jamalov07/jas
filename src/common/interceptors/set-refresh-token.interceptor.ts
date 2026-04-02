import { Injectable, NestInterceptor, ExecutionContext, CallHandler, UnauthorizedException, Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../modules/shared'
import { ConfigService } from '@nestjs/config'
import { Observable } from 'rxjs'
import { isJWT } from 'class-validator'
import { magenta } from 'colors'
import { ERROR_MSG } from '../constants'

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
	private readonly logger = new Logger('RefreshTokenInterceptor')

	constructor(
		private readonly configService: ConfigService,
		private readonly prismaService: PrismaService,
		private readonly jwtService: JwtService,
	) {}

	async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
		const request = context.switchToHttp().getRequest()
		const authorizationHeader = request.headers.authorization

		if (!authorizationHeader) {
			throw new UnauthorizedException(ERROR_MSG.AUTH.AUTH_HEADER_NOT_PROVIDED.UZ)
		}

		const [type, token] = authorizationHeader.split(' ') ?? []

		if (type !== 'Bearer') {
			throw new UnauthorizedException(ERROR_MSG.AUTH.INVALID_AUTH_TYPE.UZ)
		}

		if (!token) {
			throw new UnauthorizedException(ERROR_MSG.AUTH.TOKEN_NOT_PROVIDED.UZ)
		}

		if (!isJWT(token)) {
			throw new UnauthorizedException(ERROR_MSG.AUTH.INVALID_TOKEN_FORMAT.UZ)
		}

		try {
			const payload = await this.jwtService.verifyAsync(token, { secret: this.configService.get('jwt.refreshToken.key') })

			if (!payload || !payload?.id) {
				throw new UnauthorizedException(ERROR_MSG.AUTH.INVALID_TOKEN_PAYLOAD.UZ)
			}
			const user = await this.prismaService.userModel.findFirst({
				where: { id: payload?.id, token: token },
			})

			if (!user) {
				throw new UnauthorizedException(ERROR_MSG.AUTH.USER_NOT_FOUND_WITH_THIS_TOKEN.UZ)
			}

			if (user.deletedAt) {
				throw new UnauthorizedException(ERROR_MSG.AUTH.USER_WAS_DELETED.UZ)
			}

			request['user'] = { id: user.id, token: token }

			this.logger.debug(magenta({ ...request['user'] }))

			return next.handle()
		} catch (e) {
			console.log(e)
			throw new UnauthorizedException(e?.message || ERROR_MSG.AUTH.TOKEN_VALIDATION_FAILED.UZ)
		}
	}
}
