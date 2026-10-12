import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { ReminderService } from '../../reminder/reminder.service'

@Injectable()
export class CronService {
	private readonly logger = new Logger(CronService.name)

	constructor(private readonly reminderService: ReminderService) {}

	@Cron('0 * * * *', { timeZone: 'Asia/Tashkent' })
	async sendDueReminders() {
		const result = await this.reminderService.dispatchDue()
		this.logger.log(
			`client reminders processed=${result.processed} sent=${result.sentToClients} noTelegram=${result.skippedNoTelegram} waiting=${result.waitingForBot}`,
		)
	}

	@Cron('0 8 * * *', { timeZone: 'Asia/Tashkent' })
	async sendReminderChannel() {
		const result = await this.reminderService.dispatchChannel()
		this.logger.log(`reminder channel delivered=${result.channelDelivered} count=${result.processed} noTelegram=${result.skippedNoTelegram}`)
	}
}
