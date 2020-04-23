import type {Parser} from 'binary-parser'

// Contrib to DT? Looks like a lot of work might need to be done...
// Frankly i should just write @kobold/binary-reader because this lib is shaky
declare module 'binary-parser' {
	interface Parser<O> {
		// I have no idea how to type this under their current defs (if it's even possible), let's just generic it
		nest<T extends object>(
			options: Parser.NestOptions,
		): Parser<Parser.Valid<O, T>>

		sizeOf(): number
		seek(length: (this: Parser.Parsed<O>) => number): Parser<O>
		saveOffset<N extends string>(name: N): Parser.Next<O, N, number>
	}
}
