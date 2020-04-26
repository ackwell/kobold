import {File} from '@kobold/core'
import {Parser} from 'binary-parser'
import {assert} from '../utilities'

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

// I swear to god if they try to use this before load imma throw a hissy
// TODO: maybe i should just bite the damn bullet and use a constructor
const emptyBuffer = Buffer.alloc(0)

export class ExcelData extends File {
	version = 0
	// TODO: should I expose the indexSize?
	rowOffsets = new Map<number, number>()
	data = emptyBuffer

	load(contents: Buffer) {
		// Sanity check the magic
		const magic = contents.subarray(0, 4).toString()
		assert(magic === 'EXDF', 'No EXDF magic found.')

		this.data = contents

		const parsed = excelDataParser.parse(contents)

		this.version = parsed.header.version

		for (const rowOffset of parsed.rowOffsets) {
			this.rowOffsets.set(rowOffset.rowId, rowOffset.offset)
		}
	}
}
