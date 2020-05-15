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

describe('fields', () => {
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

	it('string', () => {
		const encoder = new TextEncoder()
		const input = encoder.encode('testnull terminated\0test3')

		class StringParser extends Parser {
			one = this.string({length: 4})
			two = this.string()
			three = this.string({length: 5})
		}
		const parsed = new StringParser({buffer: input})

		expect(parsed.one).toBe('test')
		expect(parsed.two).toBe('null terminated')
		expect(parsed.three).toBe('test3')
	})

	it('struct', () => {
		const {buffer, dataView} = buildDataView(12)
		dataView.setUint16(0, 24565)
		dataView.setUint16(2, 44567, true)
		dataView.setUint16(4, 32345)
		dataView.setUint16(6, 52345, true)
		dataView.setUint16(8, 2356)
		dataView.setUint16(10, 45161, true)

		class SubStruct extends Parser {
			one = this.uint16()
			two = this.uint16({endianness: Endianness.LITTLE})
		}

		class Struct extends Parser {
			one = this.struct({type: SubStruct})
			two = this.struct({type: SubStruct})
			three = this.struct({type: SubStruct})
		}
		const parsed = new Struct({buffer})

		expect(parsed.one).toMatchObject({one: 24565, two: 44567})
		expect(parsed.two).toMatchObject({one: 32345, two: 52345})
		expect(parsed.three).toMatchObject({one: 2356, two: 45161})
	})
})
