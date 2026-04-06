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

	async getStaffById(id: string) {
		const staff = await this.prisma.staffModel.findFirst({
			where: { id },
			select: { id: true, type: true, currencyId: true },
		})

		return staff
	}

	async updateStaffCurrency(staffId: string, currencyId: string) {
		const staff = await this.prisma.staffModel.update({
			where: { id: staffId },
			data: { currencyId },
		})

		return staff
	}
}
