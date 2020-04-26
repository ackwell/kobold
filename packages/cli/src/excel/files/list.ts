import {File} from '@kobold/core'
import {assert} from '../../utilities'

export class ExcelList extends File {
	// Mapping of sheet names to their (game) internal IDs
	// An ID of -1 means the header is not loaded on init in-game - irrelevant in our case for now.
	sheets = new Map<string, number>()

	load(contents: Buffer) {
		// EXL are actually plaintext
		const contentString = contents.toString()

		let hasMagic = false
		for (const line of contentString.split('\r\n')) {
			// Lines are of the format "SheetName,index"
			const commaIndex = line.indexOf(',')
			if (commaIndex === -1) {
				continue
			}

			const sheetName = line.substring(0, commaIndex)

			if (sheetName === 'EXLT') {
				hasMagic = true
				continue
			}

			const index = parseInt(line.substring(commaIndex + 1), 10)
			this.sheets.set(sheetName, index)
		}

		assert(hasMagic, 'No EXLT magic found.')
	}
}
