import type {Parser} from 'binary-parser'

// Contrib to DT? Looks like a lot of work might need to be done...
// Frankly i should just write @kobold/binary-reader because this lib is shaky
declare module 'binary-parser' {
	interface Parser<O> {
		sizeOf(): number
	}
}
