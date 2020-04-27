import {assert} from '../utilities'
import {ExcelHeader, ColumnDataType, ColumnDefinition} from './files'

interface RowConstructorOptions {
	index: number
	sheetHeader: ExcelHeader
	data: Buffer
}

export interface RowConstructor<T extends Row> {
	new (opts: RowConstructorOptions): T
	sheet: string
}

type ColumnSeekOptions =
	| {column: number; offset?: undefined}
	| {offset: number; column?: undefined}

export class Row {
	static get sheet(): string {
		throw new Error(`Missing \`static sheet\` declaration on ${this.name}.`)
	}

	index: number

	// TODO: Do I want the entire header, or a subset?
	private sheetHeader: ExcelHeader
	private data: Buffer
	private currentColumn = 0

	constructor(opts: RowConstructorOptions) {
		this.index = opts.index
		this.sheetHeader = opts.sheetHeader
		this.data = opts.data
	}

	// TODO: Accept options to jump around and shit?
	private getColumnDefinition(opts?: ColumnSeekOptions) {
		if (opts?.offset != null) {
			const index = this.sheetHeader.columns.findIndex(
				column => column.offset === opts.offset,
			)
			assert(
				index !== -1,
				`Explicit offset ${opts.offset} does not match any column definitions.`,
			)
			this.currentColumn = index
		} else if (opts?.column != null) {
			this.currentColumn = opts.column
		}

		assert(
			this.currentColumn < this.sheetHeader.columns.length,
			`Defined column ${this.currentColumn} exceeds maximum of ${
				this.sheetHeader.columns.length - 1
			}`,
		)

		return this.sheetHeader.columns[this.currentColumn++]
	}

	protected unknown(opts?: ColumnSeekOptions) {
		// NOOP - retrieve the column definition to advance to the next column position
		this.getColumnDefinition(opts)
	}

	protected string(opts?: ColumnSeekOptions) {
		const definition = this.getColumnDefinition(opts)
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

	protected boolean(opts?: ColumnSeekOptions) {
		const definition = this.getColumnDefinition(opts)

		switch (definition.dataType) {
			case ColumnDataType.BOOLEAN:
				return this.data.readUInt8(definition.offset) !== 0
			case ColumnDataType.PACKED_BOOL_0:
			case ColumnDataType.PACKED_BOOL_1:
			case ColumnDataType.PACKED_BOOL_2:
			case ColumnDataType.PACKED_BOOL_3:
			case ColumnDataType.PACKED_BOOL_4:
			case ColumnDataType.PACKED_BOOL_5:
			case ColumnDataType.PACKED_BOOL_6:
			case ColumnDataType.PACKED_BOOL_7: {
				const bit = 1 << (definition.dataType - ColumnDataType.PACKED_BOOL_0)
				const value = this.data.readUInt8(definition.offset)
				return (value & bit) === bit
			}
		}

		// TODO: assert.fail
		throw new Error(this.getUnsupportedMessage('boolean', definition))
	}

	protected number(opts?: ColumnSeekOptions) {
		const definition = this.getColumnDefinition(opts)

		switch (definition.dataType) {
			case ColumnDataType.INT_8:
				return this.data.readInt8(definition.offset)
			case ColumnDataType.UINT_8:
				return this.data.readUInt8(definition.offset)
			case ColumnDataType.INT_16:
				return this.data.readInt16BE(definition.offset)
			case ColumnDataType.UINT_16:
				return this.data.readUInt16BE(definition.offset)
			case ColumnDataType.INT_32:
				return this.data.readInt32BE(definition.offset)
			case ColumnDataType.UINT_32:
				return this.data.readUInt32BE(definition.offset)
			case ColumnDataType.FLOAT_32:
				return this.data.readFloatBE(definition.offset)
		}

		// TODO: assert.fail
		throw new Error(this.getUnsupportedMessage('number', definition))
	}

	protected bigint(opts?: ColumnSeekOptions) {
		const definition = this.getColumnDefinition(opts)

		switch (definition.dataType) {
			case ColumnDataType.INT_64:
				return this.data.readBigInt64BE(definition.offset)
			case ColumnDataType.UINT_64:
				return this.data.readBigUInt64BE(definition.offset)
		}
		// TODO: assert.fail
		throw new Error(this.getUnsupportedMessage('bigint', definition))
	}

	private getUnsupportedMessage(
		requestedType: string,
		column: ColumnDefinition,
	) {
		const columnIndex = this.sheetHeader.columns.indexOf(column)
		return `Unsupported ${requestedType} data type ${
			ColumnDataType[column.dataType]
		} at offset ${column.offset} (column ${columnIndex})`
	}
}

// this shouldn't be here but fucking whatever right now tbqh
export class Status extends Row {
	static sheet = 'Status'

	// column defs - let's see if this is a good idea
	name = this.string()
	description = this.string()
	icon = this.number()
	maxStacks = this.number()
	// unknown UINT_8
	category = this.number({column: 5})
	hitEffect = this.number()
	vfx = this.number()
	lockMovement = this.boolean()
	lockActions = this.boolean()
	// unknown PACKED_BOOL_2
	lockControl = this.boolean({column: 11})
	transfiguration = this.boolean()
	// unknown PACKED_BOOL_5
	canDispel = this.boolean({column: 14})
	inflictedByActor = this.boolean()
	isPermanent = this.boolean()
	partyListPriority = this.number()
	// unknown PACKED_BOOL_1
	// unknown PACKED_BOOL_2
	// unknown INT_16
	// unknown UINT_8
	// unknown PACKED_BOOL_3
	log = this.number({column: 23})
	isFcBuff = this.boolean()
	invisiblity = this.boolean()
	// unknown UINT_8
	// unknown UINT_8
	// unknown PACKED_BOOL_6
}
