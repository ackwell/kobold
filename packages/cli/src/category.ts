import {Path} from './path'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'
import util from 'util'
import {
	sqPackIndexParser,
	sqPackIndex2Parser,
	HashTablePackedOffset,
} from './parser/sqPackIndex'
import {assert} from './utilities'
import zlib from 'zlib'
import {
	fileInfoParser,
	FileType,
	blockInfoParser,
	blockHeaderParser,
	BlockInfo,
} from './parser/sqPackDat'

const async = {
	fs: {
		readFile: util.promisify(fs.readFile),
		open: util.promisify(fs.open),
		close: util.promisify(fs.close),
		read: util.promisify(fs.read),
	},
	zlib: {inflateRaw: util.promisify(zlib.inflateRaw)},
}

const asyncReadBuffer = (fd: number, length: number, offset: number) =>
	async.fs.read(fd, Buffer.alloc(length), 0, length, offset)

enum IndexType {
	INDEX,
	INDEX2,
}

type IndexMap = Map<bigint, HashTablePackedOffset>

// TODO: Most of this should be broken out into CategoryChunk handling
export class Category {
	private readonly categoryId: number
	private readonly repositoryPath: string

	private indexCache = new Map<IndexType, Promise<IndexMap>>()

	constructor(opts: {categoryId: number; repositoryPath: string}) {
		this.categoryId = opts.categoryId
		this.repositoryPath = opts.repositoryPath
	}

	private get idPrefix() {
		return this.categoryId.toString(16).padStart(2, '0').slice(0, 2)
	}

	private async buildIndexes(type: IndexType) {
		const extension = type === IndexType.INDEX ? 'index' : 'index2'
		// Find index files
		const indexFiles = await glob(`${this.idPrefix}????.*.${extension}`, {
			cwd: this.repositoryPath,
			caseSensitiveMatch: false,
		})

		// TODO: Check > 0 index
		assert(indexFiles.length === 1, 'TODO: Handle multiple chunks')

		const indexPath = path.join(this.repositoryPath, indexFiles[0])
		const indexBuffer = await async.fs.readFile(indexPath)

		const parser =
			type === IndexType.INDEX ? sqPackIndexParser : sqPackIndex2Parser
		const parsed = parser.parse(indexBuffer)

		const indexes = new Map<bigint, HashTablePackedOffset>()
		for (const entry of parsed.indexes) {
			const key =
				typeof entry.hash === 'bigint' ? entry.hash : BigInt(entry.hash)
			indexes.set(key, entry)
		}

		return indexes
	}

	private getIndexes(type: IndexType) {
		let indexPromise = this.indexCache.get(type)
		if (indexPromise == null) {
			indexPromise = this.buildIndexes(type)
			this.indexCache.set(type, indexPromise)
		}

		return indexPromise
	}

	private async getFileEntry(pathInfo: Path) {
		// TODO: Consider if both indexes should be preloaded. As-is, we're lazy loading both,
		// so a theoretical lookup that's only in index2 would have two sequential lookups, not parallel
		const entry =
			(await this.getIndexes(IndexType.INDEX)).get(pathInfo.indexHash) ??
			(await this.getIndexes(IndexType.INDEX2)).get(pathInfo.index2Hash)
		return entry
	}

	async getFile(pathInfo: Path) {
		// const indexes = await this.getIndexes()
		const entry = await this.getFileEntry(pathInfo)
		if (entry == null) {
			// TODO: ?
			return
		}

		console.log(
			`found offset for ${pathInfo.path} (${pathInfo.indexHash}):`,
			entry,
		)

		// TODO: do all of this stuff properly
		const fd = await async.fs.open(
			path.join(
				this.repositoryPath,
				`${this.idPrefix}0000.win32.dat${entry.dataFileId}`,
			),
			'r',
		)

		const fileInfoSize = fileInfoParser.sizeOf()
		const {buffer: fileInfoBuffer} = await asyncReadBuffer(
			fd,
			fileInfoSize,
			entry.offset,
		)
		const fileInfo = fileInfoParser.parse(fileInfoBuffer)
		console.log('file info:', fileInfo)

		assert(
			fileInfo.type === FileType.STANDARD,
			'TODO: Better handling for file types',
		)

		const blockInfoSize = blockInfoParser.sizeOf()
		const blockInfoGroupSize = blockInfoSize * fileInfo.blockCount
		const {buffer: blockInfoBuffer} = await asyncReadBuffer(
			fd,
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

		const fileBuffer = Buffer.concat(blocks, fileInfo.rawFileSize)

		// TODO: Cache FDs?
		// Close the FD - no await as timing of close is irrelevant
		async.fs.close(fd)

		return fileBuffer
	}

	private async readBlock(
		blockInfo: BlockInfo,
		fd: number,
		baseOffset: number,
	) {
		const {buffer: blockBuffer} = await asyncReadBuffer(
			fd,
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

		return async.zlib.inflateRaw(blockData) as Promise<Buffer>
	}
}
