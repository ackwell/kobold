import type {Parser} from 'binary-parser'

// Contrib to DT? Looks like a lot of work might need to be done...
declare module 'binary-parser' {
	interface Parser<O> {
		sizeOf(): number
		seek(length: (this: Parser.Parsed<O>) => number): Parser<O>
		saveOffset<N extends string>(name: N): Parser.Next<O, N, number>
	}
}
