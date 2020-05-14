export enum Endianness {
	BIG,
	LITTLE,
}

interface NumberOptions {
	endianness?: Endianness
}

export class Parser {
	static fromBuffer<T extends typeof Parser>(this: T, buffer: Buffer) {
		return new this({
			data: new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength),
		}) as InstanceType<T>
	}

	protected endianness?: Endianness

	private data: DataView
	private offset = 0

	constructor(opts: {data: DataView}) {
		this.data = opts.data
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
		return this.data.getUint8(this.fieldOffset(1))
	}

	protected uint16(opts?: NumberOptions): number {
		return this.data.getUint16(
			this.fieldOffset(2),
			this.isLittleEndian(opts?.endianness),
		)
	}
}
