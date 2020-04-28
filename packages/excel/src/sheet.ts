import {Kobold} from '@kobold/core'
import {Parser} from 'binary-parser'
import {ExcelHeader, Variant, ExcelPage, Language} from './files'
import {Row, RowConstructor} from './row'
import {assert} from './utilities'

// TODO: where should this live? is it composed by excel, or is it handled as part of the page file reader itself?
// Should page pre-parse rows?
const rowHeaderParser = new Parser()
	.endianess('big')
	.uint32('dataSize')
	.uint16('rowCount')
const rowHeaderSize = rowHeaderParser.sizeOf()

const languageStringMap: Record<Language, string> = {
	[Language.NONE]: 'NONE',
	[Language.JAPANESE]: 'ja',
	[Language.ENGLISH]: 'en',
	[Language.GERMAN]: 'de',
	[Language.FRENCH]: 'fr',
	[Language.CHINESE_SIMPLIFIED]: 'chs',
	[Language.CHINESE_TRADITIONAL]: 'cht',
	[Language.KOREAN]: 'ko',
}

export class Sheet<T extends Row> {
	private kobold: Kobold
	private RowClass: RowConstructor<T>
	private language: Language
	private header?: ExcelHeader

	constructor(opts: {
		kobold: Kobold
		RowClass: RowConstructor<T>
		language: Language
	}) {
		this.kobold = opts.kobold
		this.RowClass = opts.RowClass
		this.language = opts.language
	}

	async getRow(index: number) {
		const header = await this.getHeader()

		// Work out what page the requested row is on
		const pageDefinition = header.pages.find(
			page => page.startId < index && page.startId + page.rowCount > index,
		)
		assert(
			pageDefinition != null,
			`Requested index ${index} is not defined by any sheet pages`,
		)

		const page = await this.getPage(pageDefinition.startId)

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

	private getPage(startId: number) {
		// TODO: Cache
		const language = this.language
		// exd/{sheetName}_{page}[_{languageString}].exd
		const path =
			language === Language.NONE
				? `exd/${this.RowClass.sheet}_${startId}.exd`
				: `exd/${this.RowClass.sheet}_${startId}_${languageStringMap[language]}.exd`.toLowerCase()

		return this.kobold.getFile(path, ExcelPage)
	}

	// TODO: Probably should rename this given how much logic i'm throwing in
	private async getHeader() {
		if (this.header == null) {
			const path = `exd/${this.RowClass.sheet}.exh`
			this.header = await this.kobold.getFile(path, ExcelHeader)
		}

		// If the sheet _only_ supports NONE, silently fall back
		const {languages} = this.header
		if (languages.length === 1 && languages[0] === Language.NONE) {
			this.language = Language.NONE
		}

		// If the requested language isn't supported by the sheet, panic
		assert(
			languages.includes(this.language),
			`Requested language ${Language[this.language]} is not provided by sheet ${
				this.RowClass.sheet
			} (provided: ${languages.map(lang => Language[lang]).join(', ')})`,
		)

		// TODO: Sort out subrows
		assert(this.header.variant === Variant.DEFAULT)

		return this.header
	}
}
