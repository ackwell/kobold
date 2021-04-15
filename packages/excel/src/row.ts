import {ColumnDataType, ColumnDefinition, ExcelHeader, Variant} from './files'
import {assert} from './utilities'

interface RowConstructorOptions {
	index: number
	subIndex: number
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

// uint16 subrowId
const SUBROW_HEADER_SIZE = 2

export abstract class Row {
	private static _sheet?: string
	static get sheet(): string {
		if (this._sheet != null) {
			return this._sheet
		}
		throw new Error(`Missing \`static sheet\` declaration on ${this.name}.`)
	}
	static set sheet(value) {
		this._sheet = value
	}

	public get columnsCount(): number {
		return this.sheetHeader.columns.length
	}

	index: number
	subIndex: number

	private sheetHeader: ExcelHeader
	private data: Buffer
	private currentColumn = 0

	// TODO: Consider moving row parsing logic to an external class so consumers aren't dodging all the private members
	//       That, or use es private fields?
	constructor(opts: RowConstructorOptions) {
		this.index = opts.index
		this.subIndex = opts.subIndex
		this.sheetHeader = opts.sheetHeader
		this.data = opts.data
	}

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

		const baseDefinition = this.sheetHeader.columns[this.currentColumn++]

		const offset =
			this.sheetHeader.variant === Variant.SUBROWS
				? this.calculateSubrowOffset(baseDefinition.offset)
				: baseDefinition.offset

		return {
			...baseDefinition,
			offset,
		}
	}

	private calculateSubrowOffset(baseOffset: number) {
		const subrowOffset =
			this.subIndex * (this.sheetHeader.rowSize + SUBROW_HEADER_SIZE)

		return subrowOffset + SUBROW_HEADER_SIZE + baseOffset
	}

	protected unknown(
		opts?: ColumnSeekOptions,
	): {type: ColumnDataType; value: string | number | bigint | boolean | null} {
		const definition = this.getColumnDefinition(opts)
		let value: string | number | bigint | boolean | null
		switch (definition.dataType) {
			case ColumnDataType.BOOLEAN:
			case ColumnDataType.PACKED_BOOL_0:
			case ColumnDataType.PACKED_BOOL_1:
			case ColumnDataType.PACKED_BOOL_2:
			case ColumnDataType.PACKED_BOOL_3:
			case ColumnDataType.PACKED_BOOL_4:
			case ColumnDataType.PACKED_BOOL_5:
			case ColumnDataType.PACKED_BOOL_6:
			case ColumnDataType.PACKED_BOOL_7:
				value = this.boolean(opts)
				break
			case ColumnDataType.STRING:
				value = this.string(opts)
				break
			case ColumnDataType.INT_8:
			case ColumnDataType.UINT_8:
			case ColumnDataType.INT_16:
			case ColumnDataType.UINT_16:
			case ColumnDataType.INT_32:
			case ColumnDataType.UINT_32:
			case ColumnDataType.FLOAT_32:
				value = this.number(opts)
				break
			case ColumnDataType.INT_64:
			case ColumnDataType.UINT_64:
				value = this.bigint(opts)
				break
			default:
				value = null
				break
		}
		return {type: definition.dataType, value}
	}

	protected string(opts?: ColumnSeekOptions) {
		// Subrow sheets nessecarily cannot contain strings
		assert(
			this.sheetHeader.variant !== Variant.SUBROWS,
			`Sheets of type SUBROWS do not support string values`,
		)

		const definition = this.getColumnDefinition(opts)
		assert(
			definition.dataType === ColumnDataType.STRING,
			this.getUnsupportedMessage('string', definition),
		)

		// Get the specified offset of the start of the string, and search from there
		// for the following null byte, marking the end.
		const stringOffset = this.data.readUInt32BE(definition.offset)
		const dataOffset = stringOffset + this.sheetHeader.rowSize
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
