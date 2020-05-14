import {Parser} from '../src'

function buildDataView(size: number) {
	const buffer = Buffer.alloc(size)
	return new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
}

describe('field positions', () => {
	it('advances after reading a field', () => {
		class Advances extends Parser {
			one = this.uint8()
			two = this.uint8()
		}
		const parsed = Advances.fromBuffer(Buffer.from([1, 2]))

		expect(parsed.one).toBe(1)
		expect(parsed.two).toBe(2)
	})
})

describe('primitive values', () => {
	it('uint8', () => {
		const value = 146

		class Uint8 extends Parser {
			test = this.uint8()
		}
		const parsed = Uint8.fromBuffer(Buffer.from([value]))

		expect(parsed.test).toBe(value)
	})

	it('uint16', () => {
		const input = buildDataView(6)
		input.setUint16(0, 2346)
		input.setUint16(2, 8678)
		input.setUint16(4, 3568, true)

		class Uint16 extends Parser {
			one = this.uint16()
			two = this.uint16({endianness: 'big'})
			three = this.uint16({endianness: 'little'})
		}
		const parsed = new Uint16({data: input})

		expect(parsed.one).toBe(2346)
		expect(parsed.two).toBe(8678)
		expect(parsed.three).toBe(3568)
	})
})
