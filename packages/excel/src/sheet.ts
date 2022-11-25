import {Kobold} from '@kobold/core'
import {Parser} from 'binary-parser'
import {ExcelHeader, ExcelPage, Language, PageDefinition} from './files'
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
	private headerCache?: ExcelHeader
	private pageCache = new Map<string, ExcelPage>()

	constructor(opts: {
		kobold: Kobold
		RowClass: RowConstructor<T>
		language: Language
	}) {
		this.kobold = opts.kobold
		this.RowClass = opts.RowClass
		this.language = opts.language
	}

	async *getRows(opts?: {from: number; to: number}) {
		const header = await this.getHeader()

		// Make sure they pass the lower of the two as froms
		if (opts?.from != null && opts.to != null) {
			assert(
				opts.from <= opts.to,
				`Specified "from" row index must precede "to" index.`,
			)
		}

		// Work out what pages the requested from/to rows reside in, falling back to first/last. Prettier _really_ fucks these up
		// prettier-ignore
		const from = opts?.from != null
			? this.getPageForRow(header.pages, opts.from)
			: 0
		// prettier-ignore
		const to = opts?.to != null
			? this.getPageForRow(header.pages, opts.to)
			: header.pages.length - 1
		const pageDefinitions = header.pages.slice(from, to + 1)

		// Preload the pages we'll be looping
		const pagePreLoad = pageDefinitions.map(({startId}) =>
			this.getPage(startId),
		)

		// holy nested loops batman
		for await (const page of pagePreLoad) {
			for (const index of page.rowOffsets.keys()) {
				// Skip rows not contained within the requested range, if any
				if (index < (opts?.from ?? 0) || index > (opts?.to ?? Infinity)) {
					continue
				}

				const rowHeader = this.parseRowHeader(page, index)

				// TODO: DEFAULT Variants seem to be stable on rowCount:1 here, but keep an eye on it
				for (let subIndex = 0; subIndex < rowHeader.rowCount; subIndex++) {
					yield this.buildRow(header, page, index, subIndex)
				}
			}
		}
	}

	async getRow(index: number, subIndex = 0) {
		const header = await this.getHeader()

		// Work out what page the requested row is on
		const pageDefinition = header.pages[this.getPageForRow(header.pages, index)]

		const page = await this.getPage(pageDefinition.startId)

		return this.buildRow(header, page, index, subIndex)
	}

	private getPageForRow(pages: PageDefinition[], index: number) {
		const pageIndex = pages.findIndex(
			page => page.startId <= index && page.startId + page.rowCount > index,
		)
		assert(
			pageIndex >= 0,
			`Requested index ${index} is not defined by any sheet pages`,
		)
		return pageIndex
	}

	// TODO: Probably should rename this given how much logic i'm throwing in
	public async getHeader() {
		if (this.headerCache == null) {
			const path = `exd/${this.RowClass.sheet}.exh`
			this.headerCache = await this.kobold.getFile(path, ExcelHeader)
		}

		// If the sheet _only_ supports NONE, silently fall back
		const {languages} = this.headerCache
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

		return this.headerCache
	}

	private async getPage(startId: number) {
		const language = this.language

		// exd/{sheetName}_{page}[_{languageString}].exd
		const path =
			language === Language.NONE
				? `exd/${this.RowClass.sheet}_${startId}.exd`
				: `exd/${this.RowClass.sheet}_${startId}_${languageStringMap[language]}.exd`.toLowerCase()

		let page = this.pageCache.get(path)
		if (page == null) {
			page = await this.kobold.getFile(path, ExcelPage)
			this.pageCache.set(path, page)
		}

		return page
	}

	private parseRowHeader(page: ExcelPage, index: number) {
		const rowOffset = page.rowOffsets.get(index)
		assert(rowOffset != null)

		// TODO: This subarray call is unfortunate - look into getting rid of it
		return rowHeaderParser.parse(
			page.data.subarray(rowOffset, rowOffset + rowHeaderSize),
		)
	}

	private buildRow(
		header: ExcelHeader,
		page: ExcelPage,
		index: number,
		subIndex: number,
	) {
		const rowOffset = page.rowOffsets.get(index)
		assert(rowOffset != null)

		// TODO: This is duplicated work when using getRows() - look into consolidating
		const rowHeader = this.parseRowHeader(page, index)

		assert(
			subIndex < 0 || subIndex < rowHeader.rowCount,
			`Requested subrow ${subIndex} of row ${index} outside valid range 0 - ${
				rowHeader.rowCount - 1
			}`,
		)

		const rowStart = rowOffset + rowHeaderSize
		const rowLength = header.rowSize + rowHeader.dataSize
		const rowData = page.data.subarray(rowStart, rowStart + rowLength)

		return new this.RowClass({
			index,
			subIndex,
			sheetHeader: header,
			data: rowData,
		})
	}
}
