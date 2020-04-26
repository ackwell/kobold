import {Kobold} from '@kobold/core'
import {assert} from '../utilities'
import {ExcelList} from './files'
import {Sheet, SheetConstructor} from './sheet'

export class Excel {
	private kobold: Kobold
	private rootList?: ExcelList

	constructor(opts: {kobold: Kobold}) {
		this.kobold = opts.kobold
	}

	async getSheet<T extends Sheet>(SheetClass: SheetConstructor<T>): Promise<T> {
		// TODO: Sheet cache

		// Make sure the sheet (technically) exists
		const sheetName = SheetClass.sheet
		const {sheets} = await this.getRootList()
		assert(
			sheets.has(sheetName),
			`Sheet ${sheetName} is not listed in the root excel list.`,
		)

		const sheet = new SheetClass({kobold: this.kobold})

		return sheet
	}

	private async getRootList() {
		if (this.rootList == null) {
			this.rootList = await this.kobold.getFile('exd/root.exl', ExcelList)
			assert(this.rootList != null, 'exd/root.exl missing')
		}

		return this.rootList
	}
}
