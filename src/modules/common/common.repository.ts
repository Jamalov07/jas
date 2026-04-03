import { Injectable } from '@nestjs/common'
import { PrismaService } from '../shared'
import { DayCloseGetOneRequest } from './interfaces'

@Injectable()
export class CommonRepository {
	private readonly prisma: PrismaService
	constructor(prisma: PrismaService) {
		this.prisma = prisma
	}

	async createDayClose() {
		const dayClose = await this.prisma.dayCloseLog.create({ data: { closedDate: new Date() } })

		return dayClose
	}

	async getDayClose(query: DayCloseGetOneRequest) {
		const dayClose = await this.prisma.dayCloseLog.findFirst({ where: { closedDate: new Date() } })

		return { isClosed: dayClose ? true : false }
	}

	async getUserById(id: string) {
		const user = await this.prisma.userModel.findFirst({
			where: { id },
			select: { id: true, type: true, currencyId: true },
		})

		return user
	}

	async updateStaffCurrency(userId: string, currencyId: string) {
		const user = await this.prisma.userModel.update({
			where: { id: userId },
			data: { currencyId },
		})

		return user
	}
}
