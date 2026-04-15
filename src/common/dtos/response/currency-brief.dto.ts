import { ApiProperty } from '@nestjs/swagger'

export class CurrencyBriefDto {
	@ApiProperty({ type: String })
	id: string

	@ApiProperty({ type: String })
	name: string

	@ApiProperty({ type: String })
	symbol: string
}
