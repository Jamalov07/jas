import { Injectable } from '@nestjs/common'
import { PrismaService } from '@shared'
import { StaffSignInRequest } from './interfaces'

@Injectable()
export class AuthRepository {
	private readonly prisma: PrismaService

	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async findOneStaff(body: StaffSignInRequest) {
		const staff = await this.prisma.staffModel.findFirst({
			where: { phone: body.phone },
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
			},
		})

		return staff
	}
}
