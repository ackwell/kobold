import {Parser, Endianness} from '../src'

function buildDataView(size: number) {
	const buffer = Buffer.alloc(size)
	return {
		buffer,
		dataView: new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength),
	}
}

describe('field positions', () => {
	it('advances after reading a field', () => {
		class Advances extends Parser {
			one = this.uint8()
			two = this.uint8()
		}
		const parsed = new Advances({buffer: Buffer.from([1, 2])})

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
		const parsed = new Uint8({buffer: Buffer.from([value])})

		expect(parsed.test).toBe(value)
	})

	it('uint16', () => {
		const {buffer, dataView} = buildDataView(6)
		dataView.setUint16(0, 2346)
		dataView.setUint16(2, 8678)
		dataView.setUint16(4, 3568, true)

		class Uint16 extends Parser {
			one = this.uint16()
			two = this.uint16({endianness: Endianness.BIG})
			three = this.uint16({endianness: Endianness.LITTLE})
		}
		const parsed = new Uint16({buffer})

		expect(parsed.one).toBe(2346)
		expect(parsed.two).toBe(8678)
		expect(parsed.three).toBe(3568)

		class Uint16LE extends Parser {
			protected endianness = Endianness.LITTLE
			one = this.uint16()
		}
		const parsed2 = new Uint16LE({buffer})
		expect(parsed2.one).toBe(10761)
	})
})
