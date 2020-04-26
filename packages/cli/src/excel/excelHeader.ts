import {File} from '@kobold/core'
import {Parser} from 'binary-parser'
import {assert} from '../utilities'

const headerParser = new Parser()
	.endianess('big')
	.string('magic', {length: 4})
	.uint16('version')
	.uint16('dataOffset')
	.uint16('columnCount')
	.uint16('pageCount')
	.uint16('languageCount')
	.seek(2) // uint16 unknown1
	.seek(1) // uint8 unknown2
	.uint8('variant')
	.seek(2) // uint16 unknown3
	.uint32('rowCount')
	.seek(8) // uint32 unknown4[2]

enum Variant {
	UNKNOWN = 0,
	DEFAULT = 1,
	SUBROWS = 2,
}

const columnDefinitionParser = new Parser()
	.endianess('big')
	.uint16('dataType')
	.uint16('offset')
// TODO: When i write my own parser, shit like casting enums is gonna needta be first class
// prettier-ignore
type ColumnDefinition =
	& Omit<ReturnType<typeof columnDefinitionParser.parse>, 'dataType'>
	& {dataType: ColumnDataType}

enum ColumnDataType {
	STRING = 0x0,
	BOOLEAN = 0x1,
	INT_8 = 0x2,
	UINT_8 = 0x3,
	INT_16 = 0x4,
	UINT_16 = 0x5,
	INT_32 = 0x6,
	UINT_32 = 0x7,
	UNKNOWN_1 = 0x8,
	FLOAT_32 = 0x9,
	INT_64 = 0xa,
	UINT_64 = 0xb,
	UNKNOWN_2 = 0xc,

	// Read as <0>&0b1, <1>&0b10, <2>&0b100, &c
	PACKED_BOOL_0 = 0x19,
	PACKED_BOOL_1 = 0x1a,
	PACKED_BOOL_2 = 0x1b,
	PACKED_BOOL_3 = 0x1c,
	PACKED_BOOL_4 = 0x1d,
	PACKED_BOOL_5 = 0x1e,
	PACKED_BOOL_6 = 0x1f,
	PACKED_BOOL_7 = 0x20,
}

const paginationParser = new Parser()
	.endianess('big')
	.uint32('startId')
	.uint32('rowCount')
type Pagination = ReturnType<typeof paginationParser.parse>

const excelHeaderParser = new Parser()
	.nest('header', {type: headerParser})
	.array('columns', {
		type: columnDefinitionParser,
		length: 'header.columnCount',
	})
	.array('pages', {type: paginationParser, length: 'header.pageCount'})
	// why is this LE? we shall never know. rip adam's sanity.
	.array('languages', {type: 'uint16le', length: 'header.languageCount'})

// TODO: Can we assume this is xiv specific? How should they be configurable, if at all?
enum Language {
	NONE = 0,
	JAPANESE = 1,
	ENGLISH = 2,
	GERMAN = 3,
	FRENCH = 4,
	CHINESE_SIMPLIFIED = 5,
	CHINESE_TRADITIONAL = 6,
	KOREAN = 7,
}

const languageStringMap = new Map([
	[Language.JAPANESE, 'ja'],
	[Language.ENGLISH, 'en'],
	[Language.GERMAN, 'de'],
	[Language.FRENCH, 'fr'],
	[Language.CHINESE_SIMPLIFIED, 'chs'],
	[Language.CHINESE_TRADITIONAL, 'cht'],
	[Language.KOREAN, 'ko'],
])

export class ExcelHeader extends File {
	version = 0
	dataOffset = 0
	variant = Variant.UNKNOWN
	rowCount = 0
	columns: ColumnDefinition[] = []
	pages: Pagination[] = []
	languages: Language[] = []

	load(contents: Buffer) {
		// Sanity check magic
		const magic = contents.subarray(0, 4).toString()
		assert(magic === 'EXHF', 'No EXHF magic found.')

		const parsed = excelHeaderParser.parse(contents)

		this.version = parsed.header.version
		this.dataOffset = parsed.header.dataOffset
		this.variant = parsed.header.variant
		assert(this.variant in Variant)
		this.rowCount = parsed.header.rowCount

		this.columns = parsed.columns
		this.columns.forEach(column => assert(column.dataType in ColumnDataType))

		this.pages = parsed.pages

		this.languages = parsed.languages
		this.languages.forEach(language => assert(language in Language))
	}
}
