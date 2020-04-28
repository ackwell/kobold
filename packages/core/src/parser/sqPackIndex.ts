import {Parser} from 'binary-parser'

// There's a bunch of keys I use while parsing that aren't part of the final
// "data" that we want to expose. They're listed here, to be excluded.
// TODO: Look into excluding from nested types?
type InternalKeys = '__start' | '__current'

type Parsed<P extends Parser<any>> = Omit<ReturnType<P['parse']>, InternalKeys>

const sqPackHeaderParser = new Parser()
	.endianess('little')
	.saveOffset('__start')
	.array('magic', {type: 'uint8', length: 8})
	.uint8('platformId')
	.seek(3) // unknown
	.uint32('size')
	.uint32('version')
	.uint32('type')
	// Skip the remainder of the size
	.saveOffset('__current')
	.seek(function () {
		return this.size - (this.__current - this.__start)
	})
export type SqPackHeader = Parsed<typeof sqPackHeaderParser>

const lsdParser = new Parser()
	.endianess('little')
	.uint32('location')
	.uint32('size')
	.buffer('digest', {length: 64})
export type LSD = Parsed<typeof lsdParser>

const sqPackIndexHeaderParser = new Parser()
	.endianess('little')
	.saveOffset('__start')
	.uint32('size')
	.uint32('version')
	.nest('indexData', {type: lsdParser})
	.uint32('dataFileCount')
	.nest('synonymData', {type: lsdParser})
	.nest('emptyBlockData', {type: lsdParser})
	.nest('dirIndexData', {type: lsdParser})
	.uint32('indexType')
	.seek(656) // reserved
	.buffer('selfHash', {length: 64})
	.saveOffset('__current')
	.seek(function () {
		return this.size - (this.__current - this.__start)
	})
export type SqPackIndexHeader = Parsed<typeof sqPackIndexHeaderParser>

const hashTablePackedOffsetParser = new Parser()
	.endianess('little')
	.uint32('data')
export type HashTablePackedOffset = Parsed<typeof hashTablePackedOffsetParser>

const indexHashTableEntryParser = new Parser()
	.endianess('little')
	.uint64('hash')
	.nest<HashTablePackedOffset>({type: hashTablePackedOffsetParser})
	.seek(4) // padding
export type IndexHashTableEntry = Parsed<typeof indexHashTableEntryParser>

const index2HashTableEntryParser = new Parser()
	.endianess('little')
	.uint32('hash')
	.nest<HashTablePackedOffset>({type: hashTablePackedOffsetParser})

export const sqPackIndexParser = new Parser()
	.nest('sqPackHeader', {type: sqPackHeaderParser})
	.nest('sqPackIndexHeader', {type: sqPackIndexHeaderParser})
	.saveOffset('__current')
	.seek(function () {
		return this.sqPackIndexHeader.indexData.location - this.__current
	})
	.array('indexes', {
		type: indexHashTableEntryParser,
		// TODO: would be nice to type this properly
		lengthInBytes: 'sqPackIndexHeader.indexData.size',
	})
export type SqPackIndex = Parsed<typeof sqPackIndexParser>

export const sqPackIndex2Parser = new Parser()
	.nest('sqPackHeader', {type: sqPackHeaderParser})
	.nest('sqPackIndexHeader', {type: sqPackIndexHeaderParser})
	.saveOffset('__current')
	.seek(function () {
		return this.sqPackIndexHeader.indexData.location - this.__current
	})
	.array('indexes', {
		type: index2HashTableEntryParser,
		lengthInBytes: 'sqPackIndexHeader.indexData.size',
	})
