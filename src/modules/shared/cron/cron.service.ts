import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ReminderService } from '../../reminder/reminder.service'

@Injectable()
export class CronService {
	private readonly logger = new Logger(CronService.name)

	constructor(private readonly reminderService: ReminderService) {}

	@Cron('0 8 * * *', { timeZone: 'Asia/Tashkent' })
	async sendDueReminders() {
		const result = await this.reminderService.dispatchDue()
		this.logger.log(
			`reminders processed=${result.processed} sent=${result.sentToClients} noTelegram=${result.skippedNoTelegram} waiting=${result.waitingForBot} channel=${result.channelDelivered}`,
		)
	}
}
