import glob from 'fast-glob'
import fs from 'fs'
import path from 'path'
import util from 'util'
import zlib from 'zlib'
import {
	fileInfoParser,
	FileType,
	blockInfoParser,
	blockHeaderParser,
	BlockInfo,
	sqPackIndexParser,
	sqPackIndex2Parser,
} from './parser'
import {Path} from './path'
import {assert} from './utilities'

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

interface HashTableEntry {
	isSynonym: boolean
	dataFileId: number
	offset: number
}
type IndexMap = Map<bigint, HashTableEntry>

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

		assert(indexFiles.length === 1, 'TODO: Handle multiple chunks')
		const indexFile = indexFiles[0]

		const platform = indexFile.substring(
			indexFile.indexOf('.') + 1,
			indexFile.lastIndexOf('.'),
		)
		assert(
			platform === 'win32',
			`TODO: Handle other platforms. Expected 'win32', got '${platform}'.`,
		)

		const indexPath = path.join(this.repositoryPath, indexFile)
		const indexBuffer = await async.fs.readFile(indexPath)

		const parser =
			type === IndexType.INDEX ? sqPackIndexParser : sqPackIndex2Parser
		const parsed = parser.parse(indexBuffer)

		const indexes = new Map<bigint, HashTableEntry>()
		for (const entry of parsed.indexes) {
			const key =
				typeof entry.hash === 'bigint' ? entry.hash : BigInt(entry.hash)
			indexes.set(key, this.fixHashData(entry.data))
		}

		return indexes
	}

	// TODO: Write my own parser so this shit isn't required
	// Square's doing a smart thing and storing a uint32 in 28 bits, as the last 4 are always 0 and can be used for the bitfield above.
	private fixHashData = (data: number) => ({
		isSynonym: (data & 0b1) === 0b1,
		dataFileId: (data & 0b1110) >>> 1,
		offset: (data & ~0xf) * 8,
	})

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
		const entry = await this.getFileEntry(pathInfo)
		assert(entry != null, `${pathInfo.path} not found in indexes`)
		assert(!entry.isSynonym, 'TODO: Handle synonym files' + pathInfo.path)

		// TODO: handle multiple platforms
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

		const blockData = blockBuffer.subarray(
			blockHeader.size,
			blockHeader.size + blockHeader.compressedSize,
		)

		// If it's compressed, handle it as such
		if (blockHeader.compressedSize !== 32000) {
			return async.zlib.inflateRaw(blockData) as Promise<Buffer>
		}
		return Promise.resolve(blockData)
	}
}
