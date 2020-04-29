import type {Parser} from 'binary-parser'

// Need to disable this rule, as the other style does not mesh with the types I'm augmenting
/* eslint-disable @typescript-eslint/method-signature-style */

// Contrib to DT? Looks like a lot of work might need to be done...
// Frankly i should just write @kobold/binary-reader because this lib is shaky
declare module 'binary-parser' {
	interface Parser<O> {
		sizeOf(): number
	}
}
