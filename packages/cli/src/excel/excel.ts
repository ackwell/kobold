import {Kobold} from '@kobold/core'
import {assert} from '../utilities'
import {ExcelList} from './files'
import {RowConstructor, Row} from './row'
import {Sheet} from './sheet'

export class Excel {
	private kobold: Kobold
	private rootList?: ExcelList

	constructor(opts: {kobold: Kobold}) {
		this.kobold = opts.kobold
	}

	async getSheet<T extends Row>(
		RowClass: RowConstructor<T>,
	): Promise<Sheet<T>> {
		// TODO: Sheet cache

		// Make sure the sheet (technically) exists
		const sheetName = RowClass.sheet
		const {sheets} = await this.getRootList()
		assert(
			sheets.has(sheetName),
			`Sheet ${sheetName} is not listed in the root excel list.`,
		)

		const sheet = new Sheet({kobold: this.kobold, RowClass})

		return sheet
	}

	private async getRootList() {
		if (this.rootList == null) {
			this.rootList = await this.kobold.getFile('exd/root.exl', ExcelList)
		}

		return this.rootList
	}
}
