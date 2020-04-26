import {Kobold} from '@kobold/core'
import {Parser} from 'binary-parser'
import {assert} from '../utilities'
import {ExcelHeader, Variant, ExcelPage} from './files'
import {Row, RowConstructor} from './row'

// TODO: where should this live? is it composed by excel, or is it handled as part of the page file reader itself?
// Should page pre-parse rows?
const rowHeaderParser = new Parser()
	.endianess('big')
	.uint32('dataSize')
	.uint16('rowCount')

export class Sheet<T extends Row> {
	private kobold: Kobold
	private RowClass: RowConstructor<T>
	private header?: ExcelHeader

	constructor(opts: {kobold: Kobold; RowClass: RowConstructor<T>}) {
		this.kobold = opts.kobold
		this.RowClass = opts.RowClass
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
			`exd/${this.RowClass.sheet}_${pageNumber}_en.exd`,
			ExcelPage,
		)

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
			const path = `exd/${this.RowClass.sheet}.exh`
			this.header = await this.kobold.getFile(path, ExcelHeader)
		}

		return this.header
	}
}
