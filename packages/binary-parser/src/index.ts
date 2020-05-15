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

	protected string(opts?: StringOptions): string {
		// TODO: cache decoder?
		const decoder = new TextDecoder(opts?.encoding)

		// TODO: throw if offset + len > buflen?
		let length = opts?.length
		const initialOffset = this.fieldOffset(length ?? 0)

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
}
