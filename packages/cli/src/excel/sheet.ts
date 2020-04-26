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
	private header?: ExcelHeader

	constructor(opts: {kobold: Kobold}) {
		this.kobold = opts.kobold
	}

	async getRow(index: number) {
		const header = await this.getHeader()

		// TODO: Sort out subrows
		assert(header.variant === Variant.DEFAULT)

		// Work out what page the requested row is on
		const pageNumber = header.pages.findIndex(
			page => page.startId < index && page.startId + page.rowCount > index,
		)

		// TODO: Page lazy + cache
		// TODO: Don't hardcode this
		// exd/{sheetName}_{page}[_{languageString}].exd
		const page = await this.kobold.getFile(
			`exd/${this.sheet}_${pageNumber}_en.exd`,
			ExcelPage,
		)
		assert(page != null)

		const testRow = index
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

	private async getHeader() {
		if (this.header == null) {
			const path = `exd/${this.sheet}.exh`
			this.header = await this.kobold.getFile(path, ExcelHeader)
			assert(this.header != null, `${path} missing`)
		}

		return this.header
	}
}

// this shouldn't be here but fucking whatever right now tbqh
export class Status extends Sheet {
	static sheet = 'Status'
}
