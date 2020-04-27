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
const rowHeaderSize = rowHeaderParser.sizeOf()

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
		assert(
			pageNumber !== -1,
			`Requested index ${index} is not defined by any sheet pages`,
		)

		// TODO: Page lazy + cache
		// TODO: Don't hardcode this
		// exd/{sheetName}_{page}[_{languageString}].exd
		const page = await this.kobold.getFile(
			`exd/${this.RowClass.sheet}_${pageNumber}_en.exd`,
			ExcelPage,
		)

		const rowOffset = page.rowOffsets.get(index)
		assert(rowOffset != null)

		// TODO: This subarray call is unfortunate - look into getting rid of it
		const rowHeader = rowHeaderParser.parse(
			page.data.subarray(rowOffset, rowOffset + rowHeaderSize),
		)

		const rowStart = rowOffset + rowHeaderSize
		const rowLength = header.dataOffset + rowHeader.dataSize
		const rowData = page.data.subarray(rowStart, rowStart + rowLength)

		const rowInstance = new this.RowClass({
			index,
			sheetHeader: header,
			data: rowData,
		})

		return rowInstance
	}

	private async getHeader() {
		if (this.header == null) {
			const path = `exd/${this.RowClass.sheet}.exh`
			this.header = await this.kobold.getFile(path, ExcelHeader)
		}

		return this.header
	}
}
