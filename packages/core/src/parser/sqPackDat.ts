import {Parser} from 'binary-parser'
import {Parsed} from './shared'

export enum FileType {
	EMPTY = 1,
	STANDARD = 2,
	MODEL = 3,
	TEXTURE = 4,
}

export const fileInfoParser = new Parser()
	.endianess('little')
	.uint32('size')
	.uint32('type')
	.uint32('rawFileSize')
	.seek(8) // unknown
	.uint32('blockCount')
export type SqPackFileInfo = Parsed<typeof fileInfoParser>

export const blockInfoParser = new Parser()
	.endianess('little')
	.uint32('offset')
	.uint16('size')
	.uint16('uncompressedSize')
export type BlockInfo = Parsed<typeof blockInfoParser>

export const blockHeaderParser = new Parser()
	.endianess('little')
	.uint32('size')
	.skip(4) // uint32 unknown1
	.uint32('compressedSize')
	.uint32('uncompressedSize')
export type BlockHeader = Parsed<typeof blockHeaderParser>
