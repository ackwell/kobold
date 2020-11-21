import {strict as assert} from 'assert'

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

interface PrimitiveOptions<T extends PrimitiveType> {
	type: T
}

type PrimitiveReturnType<T extends PrimitiveType> = {
	uint8: number
}[T]

interface StructOptions<T extends typeof Parser> {
	type: T
}

type ArrayType = typeof Parser | PrimitiveType
interface ArrayOptions<T extends ArrayType> {
	type: T
	length: number
}

type ArrayReturnType<T extends ArrayType> = T extends PrimitiveType
	? PrimitiveReturnType<T>
	: T extends typeof Parser
	? InstanceType<T>
	: never

type ParserOptions =
	| {dryRun?: false; buffer: Uint8Array; offset?: number}
	| {dryRun: true}

export class Parser {
	static getLength() {
		const instance = new this({dryRun: true})
		return instance.getLength()
	}

	protected endianness?: Endianness

	private buffer?: Uint8Array
	private dataView?: DataView
	private initialOffset = 0
	private relativeOffset = 0

	// TODO: pull ctor opts into an interface or something
	constructor(opts: ParserOptions) {
		if (opts.dryRun) {
			return
		}

		this.buffer = opts.buffer
		this.dataView = new DataView(
			opts.buffer.buffer,
			opts.buffer.byteOffset,
			opts.buffer.byteLength,
		)

		this.initialOffset = opts.offset ?? 0
	}

	protected seek(distance: number) {
		// TODO: throw on > buf len?
		this.relativeOffset += distance
	}

	private fieldOffset(length?: number) {
		// TODO: handle more fancy position opts
		const currentOffset = this.relativeOffset
		this.seek(length ?? 0)
		return this.initialOffset + currentOffset
	}

	getLength() {
		return this.relativeOffset
	}

	private isLittleEndian(override?: Endianness) {
		return (this.endianness ?? override) === Endianness.LITTLE
	}

	protected uint8(): number {
		const offset = this.fieldOffset(1)
		return this.dataView?.getUint8(offset) ?? 0
	}

	protected uint16(opts?: NumberOptions): number {
		const offset = this.fieldOffset(2)
		return (
			this.dataView?.getUint16(offset, this.isLittleEndian(opts?.endianness)) ??
			0
		)
	}

	protected uint32(opts?: NumberOptions): number {
		const offset = this.fieldOffset(4)
		return (
			this.dataView?.getUint32(offset, this.isLittleEndian(opts?.endianness)) ??
			0
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
			// If there's no buffer, we can't sanely calculate a length
			assert(this.buffer != null, 'Cannot dry run on unknown length string.')

			while (this.uint8() !== 0) {
				// noop
			}
			length = this.relativeOffset - initialOffset - 1
		}

		if (this.buffer == null) {
			return ''
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
		const ctorOpts: ParserOptions =
			this.buffer != null
				? {buffer: this.buffer, offset: this.fieldOffset()}
				: {dryRun: true}

		const struct = new opts.type(ctorOpts) as InstanceType<T>

		this.seek(struct.getLength())

		return struct
	}

	protected array<T extends ArrayType>(
		opts: ArrayOptions<T>,
	): ArrayReturnType<T>[] {
		type R = ArrayReturnType<T>

		const type = opts.type as ArrayType
		const readItem =
			typeof type === 'string'
				? () => this.primitive({type}) as R
				: () => this.struct({type}) as R

		const result: R[] = []
		for (let i = 0; i < opts.length; i++) {
			result.push(readItem())
		}

		return result
	}
}

class UnreachableException extends Error {
	constructor(value: never) {
		super(`Recieved unexpected value ${value}`)
	}
}
