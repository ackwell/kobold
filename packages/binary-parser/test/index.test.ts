import {Parser} from '../src'

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
})
