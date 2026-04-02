import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { Tokens } from './interfaces'

@Injectable()
export class JsonWebTokenService {
	private readonly config: ConfigService
	private readonly jwt: JwtService

	constructor(jwt: JwtService, config: ConfigService) {
		this.config = config
		this.jwt = jwt
	}

	async getTokens(payload: { id: string }): Promise<Tokens> {
		return {
			accessToken: await this.getAccessToken(payload),
			refreshToken: await this.getRefreshToken(payload),
		}
	}

	private async getAccessToken(payload: { id: string }): Promise<string> {
		const accessToken = await this.jwt.signAsync(payload, {
			expiresIn: this.config.get('jwt.accessToken.time'),
			secret: this.config.get('jwt.accessToken.key'),
		})

		return accessToken
	}

	private async getRefreshToken(payload: { id: string }): Promise<string> {
		const refreshToken = await this.jwt.signAsync(payload, {
			expiresIn: this.config.get('jwt.refreshToken.time'),
			secret: this.config.get('jwt.refreshToken.key'),
		})

		return refreshToken
	}
}
