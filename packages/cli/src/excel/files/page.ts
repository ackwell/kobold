import {File} from '@kobold/core'
import {Parser} from 'binary-parser'
import {assert} from '../../utilities'

const headerParser = new Parser()
	.endianess('big')
	.string('magic', {length: 4})
	.uint16('version')
	.seek(2) // uint16 unknown1
	.uint32('indexSize')
	.seek(20) // uint16 unknown2[10]

const rowOffsetParser = new Parser()
	.endianess('big')
	.uint32('rowId')
	.uint32('offset')

const excelPageParser = new Parser()
	.endianess('big')
	.nest('header', {type: headerParser})
	.array('rowOffsets', {
		type: rowOffsetParser,
		lengthInBytes: 'header.indexSize',
	})

export class ExcelPage extends File {
	version: number
	// TODO: should I expose the indexSize?
	rowOffsets: Map<number, number>
	data: Buffer

	constructor({data}: {data: Buffer}) {
		super()

		// Sanity check the magic
		const magic = data.subarray(0, 4).toString()
		assert(magic === 'EXDF', 'No EXDF magic found.')

		this.data = data

		const parsed = excelPageParser.parse(data)

		this.version = parsed.header.version

		this.rowOffsets = new Map<number, number>()
		for (const rowOffset of parsed.rowOffsets) {
			this.rowOffsets.set(rowOffset.rowId, rowOffset.offset)
		}
	}
}
