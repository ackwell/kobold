import {Parser} from '../src'

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
