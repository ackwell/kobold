import {Parser} from 'binary-parser'

// There's a bunch of keys I use while parsing that aren't part of the final
// "data" that we want to expose. They're listed here, to be excluded.
// TODO: Look into excluding from nested types?
type InternalKeys = '__start' | '__current'

type Parsed<P extends Parser<any>> = Omit<ReturnType<P['parse']>, InternalKeys>

const sqpackHeader = new Parser()
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
export type SqpackHeader = Parsed<typeof sqpackHeader>

const lsd = new Parser()
	.endianess('little')
	.uint32('location')
	.uint32('size')
	.buffer('digest', {length: 64})
export type LSD = Parsed<typeof lsd>

const sqpackIndexHeader = new Parser()
	.endianess('little')
	.saveOffset('__start')
	.uint32('size')
	.uint32('version')
	.nest('indexData', {type: lsd})
	.uint32('dataFileCount')
	.nest('synonymData', {type: lsd})
	.nest('emptyBlockData', {type: lsd})
	.nest('dirIndexData', {type: lsd})
	.uint32('indexType')
	.seek(656) // reserved
	.buffer('selfHash', {length: 64})
	.saveOffset('__current')
	.seek(function () {
		return this.size - (this.__current - this.__start)
	})
export type SqpackIndexHeader = Parsed<typeof sqpackIndexHeader>

const indexHashTableEntry = new Parser()
	.endianess('little')
	.uint64('hash')
	.bit1('isSynonym')
	.bit3('dataFileId')
	.bit28('offset')
	.seek(4) // padding
export type IndexHashTableEntry = Parsed<typeof indexHashTableEntry>

const sqpackIndex = new Parser()
	.nest('sqpackHeader', {type: sqpackHeader})
	.nest('sqpackIndexHeader', {type: sqpackIndexHeader})
	.saveOffset('__current')
	.seek(function () {
		return this.sqpackIndexHeader.indexData.location - this.__current
	})
	.array('indexes', {
		type: indexHashTableEntry,
		// TODO: would be nice to type this properly
		lengthInBytes: 'sqpackIndexHeader.indexData.size',
	})
export type SqpackIndex = Parsed<typeof sqpackIndex>

export const parseSqpackIndex = (buffer: Buffer): SqpackIndex =>
	sqpackIndex.parse(buffer)
