import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ReminderModule } from '../../reminder/reminder.module'
import { CronService } from './cron.service'

@Module({
	imports: [ScheduleModule.forRoot(), ReminderModule],
	providers: [CronService],
	exports: [CronService],
})
export class CronModule {}
