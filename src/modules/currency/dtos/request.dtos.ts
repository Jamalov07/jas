import { IntersectionType, PickType } from '@nestjs/swagger'
import {
	CurrencyCreateOneRequest,
	CurrencyDeleteOneRequest,
	CurrencyFindManyRequest,
	CurrencyFindOneRequest,
	CurrencyGetManyRequest,
	CurrencyGetOneRequest,
	CurrencyUpdateOneRequest,
} from '../interfaces'
import { PaginationRequestDto, RequestOtherFieldsDto } from '@common'
import { CurrencyOptionalDto, CurrencyRequiredDto } from './fields.dtos'

export class CurrencyFindManyRequestDto
	extends IntersectionType(PickType(CurrencyOptionalDto, ['name', 'symbol', 'isActive']), PaginationRequestDto, PickType(RequestOtherFieldsDto, ['search']))
	implements CurrencyFindManyRequest {}

export class CurrencyFindOneRequestDto extends PickType(CurrencyRequiredDto, ['id']) implements CurrencyFindOneRequest {}

export class CurrencyGetManyRequestDto
	extends IntersectionType(CurrencyOptionalDto, PaginationRequestDto, PickType(RequestOtherFieldsDto, ['ids']))
	implements CurrencyGetManyRequest {}

export class CurrencyGetOneRequestDto extends CurrencyOptionalDto implements CurrencyGetOneRequest {}

export class CurrencyCreateOneRequestDto
	extends IntersectionType(PickType(CurrencyRequiredDto, ['name', 'symbol', 'exchangeRate']), PickType(CurrencyOptionalDto, ['isActive']))
	implements CurrencyCreateOneRequest {}

export class CurrencyUpdateOneRequestDto extends PickType(CurrencyOptionalDto, ['name', 'symbol', 'exchangeRate', 'isActive']) implements CurrencyUpdateOneRequest {}

export class CurrencyDeleteOneRequestDto
	extends IntersectionType(PickType(CurrencyRequiredDto, ['id']), PickType(RequestOtherFieldsDto, ['method']))
	implements CurrencyDeleteOneRequest {}
