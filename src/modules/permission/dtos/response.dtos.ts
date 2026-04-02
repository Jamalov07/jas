import { ApiProperty, IntersectionType, PickType } from '@nestjs/swagger'
import { PermissionFindManyData, PermissionFindManyResponse, PermissionFindOneData, PermissionFindOneResponse, PermissionModifyResponse } from '../interfaces'
import { GlobalModifyResponseDto, GlobalResponseDto, PaginationResponseDto } from '@common'
import { PermissionRequiredDto } from './fields.dtos'

export class PermissionFindOneDataDto extends PickType(PermissionRequiredDto, ['id', 'name', 'createdAt']) implements PermissionFindOneData {}

export class PermissionFindManyDataDto extends PaginationResponseDto implements PermissionFindManyData {
	@ApiProperty({ type: PermissionFindOneDataDto, isArray: true })
	data: PermissionFindOneData[]
}

export class PermissionFindManyResponseDto extends GlobalResponseDto implements PermissionFindManyResponse {
	@ApiProperty({ type: PermissionFindManyDataDto })
	data: PermissionFindManyData
}

export class PermissionFindOneResponseDto extends GlobalResponseDto implements PermissionFindOneResponse {
	@ApiProperty({ type: PermissionFindOneDataDto })
	data: PermissionFindOneData
}

export class PermissionModifyResponseDto extends IntersectionType(GlobalResponseDto, GlobalModifyResponseDto) implements PermissionModifyResponse {}
