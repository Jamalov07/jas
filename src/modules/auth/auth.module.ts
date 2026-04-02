import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PrismaModule } from '@shared'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { AuthRepository } from './auth.repository'
import { JsonWebTokenService } from './jwt.service'
import { StaffModule } from '../staff'

@Module({
	imports: [PrismaModule, JwtModule.register({ global: true }), StaffModule],
	controllers: [AuthController],
	providers: [AuthService, AuthRepository, JsonWebTokenService],
	exports: [],
})
export class AuthModule {}
