import { Injectable } from '@nestjs/common'
import { PrismaService } from '@shared'
import { StaffSignInRequest } from './interfaces'
import { UserTypeEnum } from '@prisma/client'

@Injectable()
export class AuthRepository {
	private readonly prisma: PrismaService

	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findOneStaff(body: StaffSignInRequest) {
		const staff = await this.prisma.userModel.findFirst({
			where: { phone: body.phone, type: { in: [UserTypeEnum.staff, UserTypeEnum.admin] } },
			select: {
				id: true,
				pages: true,
				fullname: true,
				password: true,
				phone: true,
				createdAt: true,
				deletedAt: true,
				updatedAt: true,
				actions: true,
				payments: true,
			},
		})

		return staff
	}
}
