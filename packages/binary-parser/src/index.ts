export enum Endianness {
	BIG,
	LITTLE,
}

interface NumberOptions {
	endianness?: Endianness
}

export class Parser {
	protected endianness?: Endianness

	private buffer: Uint8Array
	private dataView: DataView
	private offset = 0

	constructor(opts: {buffer: Uint8Array}) {
		this.buffer = opts.buffer
		this.dataView = new DataView(
			opts.buffer.buffer,
			opts.buffer.byteOffset,
			opts.buffer.byteLength,
		)
	}

	private fieldOffset(length: number) {
		const currentOffset = this.offset
		this.offset += length
		return currentOffset
	}

	private isLittleEndian(override?: Endianness) {
		return (this.endianness ?? override) === Endianness.LITTLE
	}

	protected uint8(): number {
		return this.dataView.getUint8(this.fieldOffset(1))
	}

	protected uint16(opts?: NumberOptions): number {
		return this.dataView.getUint16(
			this.fieldOffset(2),
			this.isLittleEndian(opts?.endianness),
		)
	}
}
