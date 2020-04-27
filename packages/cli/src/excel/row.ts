import {ExcelHeader, ColumnDataType} from './files'

interface RowConstructorOptions {
	sheetHeader: ExcelHeader
	data: Buffer
}

export interface RowConstructor<T extends Row> {
	new (opts: RowConstructorOptions): T
	sheet: string
}

export class Row {
	static get sheet(): string {
		throw new Error(`Missing \`static sheet\` declaration on ${this.name}.`)
	}

	// TODO: Do I want the entire header, or a subset?
	private sheetHeader: ExcelHeader
	private data: Buffer
	private currentColumn = 0

	constructor(opts: RowConstructorOptions) {
		this.sheetHeader = opts.sheetHeader
		this.data = opts.data
	}

	// TODO: Accept options to jump around and shit?
	private getColumnDefinition() {
		return this.sheetHeader.columns[this.currentColumn++]
	}

	protected unknown() {
		const def = this.getColumnDefinition()
	}

	protected number() {
		const definition = this.getColumnDefinition()
		console.log(definition)

		switch (definition.dataType) {
			// TODO: do the rest of these
			case ColumnDataType.UINT_16:
				return this.data.readUInt16BE(definition.offset)
			default:
				throw new Error(
					`TODO(assert.fail) unsupported column data type ${
						ColumnDataType[definition.dataType]
					} for number`,
				)
		}
	}
}

// this shouldn't be here but fucking whatever right now tbqh
export class Status extends Row {
	static sheet = 'Status'

	// column defs - let's see if this is a good idea
	name = this.unknown()
	description = this.unknown()
	icon = this.number()
}
