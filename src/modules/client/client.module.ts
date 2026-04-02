import { Module } from '@nestjs/common'
import { ExcelModule, PrismaModule } from '../shared'
import { ClientController } from './client.controller'
import { ClientService } from './client.service'
import { ClientRepository } from './client.repository'

@Module({
	imports: [PrismaModule, ExcelModule],
	controllers: [ClientController],
	providers: [ClientService, ClientRepository],
	exports: [ClientService, ClientRepository],
})
export class ClientModule {}
