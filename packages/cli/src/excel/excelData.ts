import {File} from '@kobold/core'
import {assert} from '../utilities'
import {Parser} from 'binary-parser'

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

const excelDataParser = new Parser()
	.endianess('big')
	.nest('header', {type: headerParser})
	.array('rowOffsets', {
		type: rowOffsetParser,
		lengthInBytes: 'header.indexSize',
	})

export class ExcelData extends File {
	version = 0
	// TODO: should I expose the indexSize?

	load(contents: Buffer) {
		// Sanity check the magic
		const magic = contents.subarray(0, 4).toString()
		assert(magic === 'EXDF', 'No EXDF magic found.')

		const parsed = excelDataParser.parse(contents)
		console.log(parsed)

		this.version = parsed.header.version
	}
}
