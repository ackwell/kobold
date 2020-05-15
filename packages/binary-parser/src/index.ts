export enum Endianness {
	BIG,
	LITTLE,
}

interface NumberOptions {
	endianness?: Endianness
}

interface StringOptions {
	encoding?: string
	length?: number
}

interface StructOptions<T extends typeof Parser> {
	type: T
}

export class Parser {
	protected endianness?: Endianness

	private buffer: Uint8Array
	private dataView: DataView
	private initialOffset: number
	private offset: number

	// TODO: pull ctor opts into an interface or something
	constructor(opts: {buffer: Uint8Array; offset?: number}) {
		this.buffer = opts.buffer
		this.dataView = new DataView(
			opts.buffer.buffer,
			opts.buffer.byteOffset,
			opts.buffer.byteLength,
		)

		this.offset = this.initialOffset = opts.offset ?? 0
	}

	private seek(distance: number) {
		// TODO: throw on > buf len?
		this.offset += distance
	}

	private fieldOffset(length?: number) {
		// TODO: handle more fancy position opts
		const currentOffset = this.offset
		this.seek(length ?? 0)
		return currentOffset
	}

	// TODO: public?
	private getLength() {
		return this.offset - this.initialOffset
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

	protected string(opts?: StringOptions): string {
		// TODO: cache decoder?
		const decoder = new TextDecoder(opts?.encoding)

		// TODO: throw if offset + len > buflen?
		let length = opts?.length
		const initialOffset = this.fieldOffset(length)

		// If no explicit length was specified, read until we find a null byte
		if (length == null) {
			while (this.uint8() !== 0) {
				// noop
			}
			length = this.offset - initialOffset - 1
		}

		return decoder.decode(
			this.buffer.subarray(initialOffset, initialOffset + length),
		)
	}

	protected struct<T extends typeof Parser>(
		opts: StructOptions<T>,
	): InstanceType<T> {
		const struct = new opts.type({
			buffer: this.buffer,
			offset: this.fieldOffset(),
		}) as InstanceType<T>

		this.seek(struct.getLength())

		return struct
	}
}
