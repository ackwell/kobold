import {Kobold} from '@kobold/core'
import {Parser} from 'binary-parser'
import {assert} from '../utilities'
import {ExcelHeader, Variant, ExcelPage} from './files'

// TODO: where should this live? is it composed by excel, or is it handled as part of the page file reader itself?
// Should page pre-parse rows?
const rowHeaderParser = new Parser()
	.endianess('big')
	.uint32('dataSize')
	.uint16('rowCount')

export interface SheetConstructor<T extends Sheet> {
	new (opts: {kobold: Kobold}): T
	sheet: string
}

export class Sheet {
	static get sheet(): string {
		throw new Error(`Missing \`static sheet\` declaration on ${this.name}.`)
	}
	get sheet() {
		return (this.constructor as typeof Sheet).sheet
	}

	private kobold: Kobold

	constructor(opts: {kobold: Kobold}) {
		this.kobold = opts.kobold
	}

	async tempTest() {
		// TODO: Sheet cache
		const header = await this.kobold.getFile(
			`exd/${this.sheet}.exh`,
			ExcelHeader,
		)
		assert(header != null)
		console.log(header)

		// TODO: Sort out subrows
		assert(header.variant === Variant.DEFAULT)

		// TODO: Don't hardcode this
		// exd/{sheetName}_{page}[_{languageString}].exd
		const page = await this.kobold.getFile(
			`exd/${this.sheet}_0_en.exd`,
			ExcelPage,
		)
		assert(page != null)

		const testRow = 9
		const testColumn = 20

		const testRowOffset = page.rowOffsets.get(testRow)
		assert(testRowOffset != null)

		const testColumnOffset = header.columns[testColumn]?.offset
		assert(testColumnOffset != null)

		const rowHeaderSize = rowHeaderParser.sizeOf()

		const testOffset = testRowOffset + testColumnOffset + rowHeaderSize
		const test = page.data.readInt16BE(testOffset)
		console.log(test)
	}
}

// this shouldn't be here but fucking whatever right now tbqh
export class Status extends Sheet {
	static sheet = 'Status'
}
