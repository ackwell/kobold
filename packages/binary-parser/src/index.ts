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

type PrimitiveType = 'uint8'

type PrimitiveReturnType<T extends PrimitiveType> = {
	uint8: number
}[T]

interface PrimitiveOptions<T extends PrimitiveType> {
	type: T
}

interface StructOptions<T extends typeof Parser> {
	type: T
}

export class Parser {
	protected endianness?: Endianness

	private buffer: Uint8Array
	private dataView: DataView
	private initialOffset: number
	private relativeOffset = 0

	// TODO: pull ctor opts into an interface or something
	constructor(opts: {buffer: Uint8Array; offset?: number}) {
		this.buffer = opts.buffer
		this.dataView = new DataView(
			opts.buffer.buffer,
			opts.buffer.byteOffset,
			opts.buffer.byteLength,
		)

		this.initialOffset = opts.offset ?? 0
	}

	private seek(distance: number) {
		// TODO: throw on > buf len?
		this.relativeOffset += distance
	}

	private fieldOffset(length?: number) {
		// TODO: handle more fancy position opts
		const currentOffset = this.relativeOffset
		this.seek(length ?? 0)
		return this.initialOffset + currentOffset
	}

	// TODO: public?
	private getLength() {
		return this.relativeOffset
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
			length = this.relativeOffset - initialOffset - 1
		}

		return decoder.decode(
			this.buffer.subarray(initialOffset, initialOffset + length),
		)
	}

	protected primitive<T extends PrimitiveType>(
		opts: PrimitiveOptions<T>,
	): PrimitiveReturnType<T> {
		type R = PrimitiveReturnType<T>
		const type = opts.type as PrimitiveType
		switch (type) {
			case 'uint8':
				return this.uint8() as R
			default:
				throw new UnreachableException(type)
		}
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

class UnreachableException extends Error {
	constructor(value: never) {
		super(`Recieved unexpected value ${value}`)
	}
}
