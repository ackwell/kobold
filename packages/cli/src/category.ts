import {Path} from './path'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'
import util from 'util'
import {parseSqPackIndex, IndexHashTableEntry} from './parser/sqPackIndex'
import {Parser} from 'binary-parser'
import {assert} from './utilities'
import zlib from 'zlib'

const asyncReadFile = util.promisify(fs.readFile)
const asyncOpen = util.promisify(fs.open)
const asyncClose = util.promisify(fs.close)
const asyncRead = util.promisify(fs.read)
const asyncInflateRaw = util.promisify(zlib.inflateRaw)

const sqPackFileInfo = new Parser()
	.endianess('little')
	.uint32('size')
	.uint32('type')
	.uint32('rawFileSize')
	.seek(8) // unknown
	.uint32('blockCount')

const blockInfoParser = new Parser()
	.endianess('little')
	.uint32('offset')
	.uint16('size')
	.uint16('uncompressedSize')
type BlockInfo = ReturnType<typeof blockInfoParser.parse>

const blockHeaderParser = new Parser()
	.endianess('little')
	.uint32('size')
	.skip(4) // uint32 unknown1
	.uint32('compressedSize')
	.uint32('uncompressedSize')

enum FileType {
	EMPTY = 1,
	STANDARD = 2,
	MODEL = 3,
	TEXTURE = 4,
}

// TODO: Most of this should be broken out into CategoryChunk handling
export class Category {
	private readonly categoryId: number
	private readonly repositoryPath: string

	private _indexes?: Promise<Map<bigint, IndexHashTableEntry>>

	constructor(opts: {categoryId: number; repositoryPath: string}) {
		this.categoryId = opts.categoryId
		this.repositoryPath = opts.repositoryPath
	}

	private get idPrefix() {
		return this.categoryId.toString(16).padStart(2, '0').slice(0, 2)
	}

	private async buildIndexes() {
		if (this._indexes != null) {
			return this._indexes
		}

		// Find index files
		// const indexFiles = await glob(`${idPrefix}????.*.index{2,}`, {
		const indexFiles = await glob(`${this.idPrefix}????.*.index`, {
			cwd: this.repositoryPath,
			caseSensitiveMatch: false,
		})

		// TODO: Check > 0 index (chunks)

		const tempIndexFname = indexFiles[0]
		const tempIndexPath = path.join(this.repositoryPath, tempIndexFname)

		const indexBuffer = await asyncReadFile(tempIndexPath)
		const parsed = parseSqPackIndex(indexBuffer)

		const indexes = new Map<bigint, IndexHashTableEntry>()
		for (const entry of parsed.indexes) {
			indexes.set(entry.hash, entry)
		}

		return indexes
	}

	private getIndexes() {
		if (this._indexes == null) {
			this._indexes = this.buildIndexes()
		}

		return this._indexes
	}

	async getFile(pathInfo: Path) {
		const indexes = await this.getIndexes()
		const entry = indexes.get(pathInfo.indexHash)
		if (entry == null) {
			// TODO: ?
			return
		}

		console.log(
			`found offset for ${pathInfo.path} (${pathInfo.indexHash}):`,
			entry,
		)

		// TODO: do all of this stuff properly
		const fd = await asyncOpen(
			path.join(
				this.repositoryPath,
				`${this.idPrefix}0000.win32.dat${entry.dataFileId}`,
			),
			'r',
		)

		const fileInfoSize = sqPackFileInfo.sizeOf()
		const {buffer: fileInfoBuffer} = await asyncRead(
			fd,
			Buffer.alloc(fileInfoSize),
			0,
			fileInfoSize,
			entry.offset,
		)
		const fileInfo = sqPackFileInfo.parse(fileInfoBuffer)
		console.log('file info:', fileInfo)

		assert(
			fileInfo.type === FileType.STANDARD,
			'TODO: Better handling for file types',
		)

		const blockInfoSize = blockInfoParser.sizeOf()
		const blockInfoGroupSize = blockInfoSize * fileInfo.blockCount
		const {buffer: blockInfoBuffer} = await asyncRead(
			fd,
			Buffer.alloc(blockInfoGroupSize),
			0,
			blockInfoGroupSize,
			entry.offset + fileInfoSize,
		)

		const blockInfos = []
		for (let i = 0; i < fileInfo.blockCount; i++) {
			const begin = blockInfoSize * i
			blockInfos.push(
				blockInfoParser.parse(
					blockInfoBuffer.subarray(begin, begin + blockInfoSize),
				),
			)
		}

		console.log('block info:', blockInfos)

		const blockPromises = blockInfos.map(blockInfo =>
			this.readBlock(blockInfo, fd, entry.offset + fileInfo.size),
		)
		const blocks = await Promise.all(blockPromises)

		// TODO: precalc length from info?
		const fileBuffer = Buffer.concat(blocks)
		console.log('file:', fileBuffer.toString())

		// TODO: Cache FDs?
		await asyncClose(fd)
	}

	private async readBlock(
		blockInfo: BlockInfo,
		fd: number,
		baseOffset: number,
	) {
		const {buffer: blockBuffer} = await asyncRead(
			fd,
			Buffer.alloc(blockInfo.size),
			0,
			blockInfo.size,
			baseOffset + blockInfo.offset,
		)

		const blockHeader = blockHeaderParser.parse(blockBuffer)
		console.log('block header:', blockHeader)

		// Adam is using 32000 as some marker for uncompressed blocks - asserting here so if it is, i can inspect what's going on for curiosity's sake
		assert(blockHeader.compressedSize !== 32000)

		// const blockHeaderSize = blockHeaderParser.sizeOf()
		const blockData = blockBuffer.subarray(
			blockHeader.size,
			blockHeader.size + blockHeader.compressedSize,
		)

		console.log('block data:', blockData)

		return asyncInflateRaw(blockData) as Promise<Buffer>
	}
}
