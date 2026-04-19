import { FileTypeValidator, MaxFileSizeValidator } from '@nestjs/common'

export const EXCEL_FILE_PIPE = {
	fileIsRequired: true,
	validators: [
		new FileTypeValidator({
			fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet|application/vnd.ms-excel',
		}),
		new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
	],
}
