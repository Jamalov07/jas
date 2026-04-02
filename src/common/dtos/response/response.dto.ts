import { ApiProperty } from '@nestjs/swagger'
import { GlobalModifyResponse, GlobalResObDef, GlobalResponse } from '../../interfaces'

class GlobalResObDefDto implements GlobalResObDef {
	@ApiProperty({ type: Boolean })
	is?: boolean = false

	@ApiProperty({ type: String, isArray: true })
	messages?: string[] = []
}

export class GlobalResponseDto implements GlobalResponse {
	@ApiProperty({ type: Number })
	status?: number = 200

	@ApiProperty({ type: GlobalResObDefDto })
	error?: GlobalResObDef = { is: false, messages: [] }

	@ApiProperty({ type: GlobalResObDefDto })
	success?: GlobalResObDef = { is: false, messages: [] }

	@ApiProperty({ type: GlobalResObDefDto })
	warning?: GlobalResObDef = { is: false, messages: [] }
}

export class GlobalModifyResponseDto implements GlobalModifyResponse {
	@ApiProperty({ nullable: true, type: 'null', example: null })
	data: null
}
