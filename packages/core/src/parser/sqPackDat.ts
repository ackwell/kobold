import {Endianness, Parser as KoboldParser} from '@kobold/binary-parser'
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

export class BlockInfo extends KoboldParser {
	endianness = Endianness.LITTLE
	offset = this.uint32()
	size = this.uint16()
	uncompressedSize = this.uint16()
}

export class BlockHeader extends KoboldParser {
	endianness = Endianness.LITTLE
	size = this.uint32()
	unknown1 = this.uint32()
	compressedSize = this.uint32()
	uncompressedSize = this.uint32()
}
