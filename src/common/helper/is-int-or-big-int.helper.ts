import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

@ValidatorConstraint({ name: 'IsIntOrBigInt', async: false })
class IsIntOrBigIntConstraint implements ValidatorConstraintInterface {
	validate(value: any) {
		return typeof value === 'bigint' || (typeof value === 'number' && Number.isInteger(value))
	}

	defaultMessage() {
		return `Value must be an integer (Int or BigInt)`
	}
}

export function IsIntOrBigInt(validationOptions?: ValidationOptions) {
	return function (object: object, propertyName: string) {
		registerDecorator({
			target: object.constructor,
			propertyName: propertyName,
			options: validationOptions,
			constraints: [],
			validator: IsIntOrBigIntConstraint,
		})
	}
}
