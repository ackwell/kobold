import {Kobold} from '@kobold/core'
import {ExcelList, Language} from './files'
import {RowConstructor, Row} from './row'
import {Sheet} from './sheet'
import {assert} from './utilities'

// TODO: Where should this live as well? Here? In a more obvious location? Next to the enum?
const fallbackLanguage: Language = Language.ENGLISH

export class Excel {
	private kobold: Kobold
	private defaultLanguage?: Language
	private rootList?: ExcelList

	constructor(opts: {kobold: Kobold; language?: Language}) {
		this.kobold = opts.kobold
		this.defaultLanguage = opts.language
	}

	async getSheet<T extends Row>(
		RowClass: RowConstructor<T>,
		opts?: {language?: Language},
	): Promise<Sheet<T>> {
		// TODO: Sheet cache

		// Make sure the sheet (technically) exists
		const sheetName = RowClass.sheet
		const {sheets} = await this.getRootList()
		assert(
			sheets.has(sheetName),
			`Sheet ${sheetName} is not listed in the root excel list.`,
		)

		const language = opts?.language ?? this.defaultLanguage ?? fallbackLanguage

		const sheet = new Sheet({
			kobold: this.kobold,
			RowClass,
			language,
		})

		return sheet
	}

	private async getRootList() {
		if (this.rootList == null) {
			this.rootList = await this.kobold.getFile('exd/root.exl', ExcelList)
		}

		return this.rootList
	}
}
