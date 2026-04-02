import { GlobalResponse } from '@common'
import { DayCloseLog } from '@prisma/client'

export declare interface DayCloseRequired extends Required<DayCloseLog> {}

export declare interface DayCloseOptional extends Partial<DayCloseLog> {}

export declare interface DayCloseCreateOneRequest {}

export declare interface DayCloseGetOneRequest {}

export declare interface DayCloseGetOneResponse extends GlobalResponse {
	data: DayCloseGetOneData
}

export declare interface DayCloseGetOneData {
	isClosed: boolean
}

export declare interface DayCloseModifyResponse extends GlobalResponse {
	data: null
}
