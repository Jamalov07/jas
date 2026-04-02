export declare interface GlobalResponse {
	status?: number

	success?: GlobalResObDef
	error?: GlobalResObDef
	warning?: GlobalResObDef
}

export declare interface GlobalResObDef {
	is?: boolean
	messages?: string[]
}

export declare interface GlobalModifyResponse {
	data: null
}
