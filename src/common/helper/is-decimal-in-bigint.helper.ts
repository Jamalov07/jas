import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator'

export function IsDecimalIntOrBigInt(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			name: 'isDecimalIntOrBigInt',
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			validator: {
				validate(value: any, args: ValidationArguments) {
					if (typeof value === 'number') {
						return Number.isFinite(value)
					}
					if (typeof value === 'string') {
						// Raqam sifatida parse qilinadi va isFinite tekshiriladi
						const parsed = parseFloat(value)
						return !isNaN(parsed) && isFinite(parsed)
					}
					return false
				},
				defaultMessage(args: ValidationArguments) {
					return `${args.property} must be a decimal, integer or numeric string`
				},
			},
		})
	}
}
