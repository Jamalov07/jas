import { Module, OnModuleInit } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import {
	ActionModule,
	ArrivalModule,
	ArrivalProductMVModule,
	AuthModule,
	BotModule,
	ClientModule,
	ClientPaymentModule,
	CommonModule,
	CurrencyModule,
	PermissionModule,
	ProductModule,
	PrismaModule,
	ReturningModule,
	ReturningProductMVModule,
	SellingModule,
	SellingProductMVModule,
	StaffModule,
	StaffPaymentModule,
	StatisticsModule,
	SupplierModule,
	SupplierPaymentModule,
	UploadModule,
} from '@module'
import { appConfig, botConfig, databaseConfig, jwtConfig, oldServiceConfig } from '@config'
import { AuthGuard, CheckPermissionGuard } from '@common'
import { PrismaService } from './modules/shared/prisma'
import { ActionController } from './modules/action/action.controller'
import { ArrivalController } from './modules/arrival/arrival.controller'
import { ClientController } from './modules/client/client.controller'
import { ClientPaymentController } from './modules/client-payment/client-payment.controller'
import { CurrencyController } from './modules/currency/currency.controller'
import { PermissionController } from './modules/permission/permission.controller'
import { ProductController } from './modules/product/product.controller'
import { ReturningController } from './modules/returning/returning.controller'
import { SellingController } from './modules/selling/selling.controller'
import { StaffController } from './modules/staff/staff.controller'
import { StaffPaymentController } from './modules/staff-payment/staff-payment.controller'
import { SupplierController } from './modules/supplier/supplier.controller'
import { SupplierPaymentController } from './modules/supplier-payment/supplier-payment.controller'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			load: [appConfig, databaseConfig, jwtConfig, botConfig, oldServiceConfig],
		}),
		ServeStaticModule.forRoot({ rootPath: join(process.cwd(), 'uploads'), serveRoot: '/uploads' }),
		PrismaModule,
		ActionModule,
		ArrivalModule,
		ArrivalProductMVModule,
		AuthModule,
		BotModule,
		ClientModule,
		ClientPaymentModule,
		CommonModule,
		CurrencyModule,
		PermissionModule,
		ProductModule,
		ReturningModule,
		ReturningProductMVModule,
		SellingModule,
		SellingProductMVModule,
		StaffModule,
		StaffPaymentModule,
		StatisticsModule,
		SupplierModule,
		SupplierPaymentModule,
		UploadModule,
	],
	controllers: [],
	providers: [AuthGuard, CheckPermissionGuard],
})
export class AppModule implements OnModuleInit {
	constructor(private readonly prisma: PrismaService) {}

	async onModuleInit() {
		await Promise.all([
			this.prisma.createActionMethods(ActionController),
			this.prisma.createActionMethods(ArrivalController),
			this.prisma.createActionMethods(ClientController),
			this.prisma.createActionMethods(ClientPaymentController),
			this.prisma.createActionMethods(CurrencyController),
			this.prisma.createActionMethods(PermissionController),
			this.prisma.createActionMethods(ProductController),
			this.prisma.createActionMethods(ReturningController),
			this.prisma.createActionMethods(SellingController),
			this.prisma.createActionMethods(StaffController),
			this.prisma.createActionMethods(StaffPaymentController),
			this.prisma.createActionMethods(SupplierController),
			this.prisma.createActionMethods(SupplierPaymentController),
		])
	}
}
