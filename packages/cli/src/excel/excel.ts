import {Kobold} from '@kobold/core'
import {Parser} from 'binary-parser'
import {assert} from '../utilities'
import {ExcelList, ExcelHeader, ExcelPage, Variant} from './files'

// TODO: where should this live? is it composed by excel, or is it handled as part of the data file reader itself?
const rowHeaderParser = new Parser()
	.endianess('big')
	.uint32('dataSize')
	.uint16('rowCount')

export class Excel {
	private kobold: Kobold
	private rootList?: ExcelList

	constructor(opts: {kobold: Kobold}) {
		this.kobold = opts.kobold
	}

	// TODO: arg should be a sheet builder probs
	async getSheet() {
		const sheetName = 'Status'

		const {sheets} = await this.getRootList()

		// Make sure the sheet (technically) exists
		assert(
			sheets.has(sheetName),
			`Sheet ${sheetName} is not listed in the root excel list.`,
		)

		// TODO: Sheet cache
		const header = await this.kobold.getFile(
			`exd/${sheetName}.exh`,
			ExcelHeader,
		)
		assert(header != null)
		console.log(header)

		// TODO: Sort out subrows
		assert(header.variant === Variant.DEFAULT)

		// TODO: Don't hardcode this
		// exd/{sheetName}_{page}[_{languageString}].exd
		const page = await this.kobold.getFile(
			`exd/${sheetName}_0_en.exd`,
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

	private async getRootList() {
		if (this.rootList == null) {
			this.rootList = await this.kobold.getFile('exd/root.exl', ExcelList)
			assert(this.rootList != null, 'exd/root.exl missing')
		}

		return this.rootList
	}
}
