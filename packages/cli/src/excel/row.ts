import {assert} from '../utilities'
import {ExcelHeader, ColumnDataType, ColumnDefinition} from './files'

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
		// NOOP - retrieve the column definition to advance to the next column position
		this.getColumnDefinition()
	}

	protected string() {
		const definition = this.getColumnDefinition()
		assert(
			definition.dataType === ColumnDataType.STRING,
			this.getUnsupportedMessage('string', definition),
		)

		// Get the specified offset of the start of the string, and search from there
		// for the following null byte, marking the end.
		const stringOffset = this.data.readUInt32BE(definition.offset)
		const dataOffset = stringOffset + this.sheetHeader.dataOffset
		const nullByteOffset = this.data.indexOf(0, dataOffset)
		return this.data.toString('utf8', dataOffset, nullByteOffset)
	}

	protected number() {
		const definition = this.getColumnDefinition()

		switch (definition.dataType) {
			// TODO: do the rest of these
			case ColumnDataType.UINT_16:
				return this.data.readUInt16BE(definition.offset)
			default:
				// TODO: assert.fail
				throw new Error(this.getUnsupportedMessage('number', definition))
		}
	}

	private getUnsupportedMessage = (
		requestedType: string,
		column: ColumnDefinition,
	) =>
		`Unsupported ${requestedType} data type ${
			ColumnDataType[column.dataType]
		} at offset ${column.offset}`
}

// this shouldn't be here but fucking whatever right now tbqh
export class Status extends Row {
	static sheet = 'Status'

	// column defs - let's see if this is a good idea
	name = this.number()
	description = this.string()
	icon = this.number()
}
