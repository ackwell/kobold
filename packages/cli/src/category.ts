import {Path} from './path'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'
import util from 'util'
import {Parser} from 'binary-parser'

// Contrib to DT? Looks like a lot of work might need to be done...
declare module 'binary-parser' {
	interface Parser<O> {
		sizeOf(): number
		seek(length: (this: Parser.Parsed<O>) => number): Parser<O>
		saveOffset<N extends string>(name: N): Parser.Next<O, N, number>
	}
}

const asyncReadFile = util.promisify(fs.readFile)

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

const lsd = new Parser()
	.endianess('little')
	.uint32('location')
	.uint32('size')
	.buffer('digest', {length: 64})

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

const indexHashTableEntry = new Parser()
	.endianess('little')
	.buffer('hash', {length: 8})
	.bit1('isSynonym')
	.bit3('dataFileId')
	.bit28('offset')
	.seek(4) // padding

const sqpackIndex = new Parser()
	.nest('sqpackHeader', {type: sqpackHeader})
	.nest('sqpackIndexHeader', {type: sqpackIndexHeader})
	.saveOffset('__current')
	.seek(function () {
		return this.sqpackIndexHeader.indexData.location - this.__current
	})
	.array('indexes', {
		type: indexHashTableEntry,
		lengthInBytes: function () {
			// TODO: Fix types
			return this.sqpackIndexHeader.indexData.size
		},
	})

export class Category {
	private categoryId: number
	private repositoryPath: string

	constructor(opts: {categoryId: number; repositoryPath: string}) {
		this.categoryId = opts.categoryId
		this.repositoryPath = opts.repositoryPath
	}

	async getFile(pathInfo: Path) {
		// Find index files
		const idPrefix = this.categoryId.toString(16).padStart(2, '0').slice(0, 2)
		// const indexFiles = await glob(`${idPrefix}????.*.index{2,}`, {
		const indexFiles = await glob(`${idPrefix}????.*.index`, {
			cwd: this.repositoryPath,
			caseSensitiveMatch: false,
		})

		// TODO: Check > 0 index

		const tempIndexFname = indexFiles[0]
		const tempIndexPath = path.join(this.repositoryPath, tempIndexFname)

		// lel
		const indexBuffer = await asyncReadFile(tempIndexPath)
		const parsed = sqpackIndex.parse(indexBuffer)

		console.log(parsed)
		// console.log(indexHashTableEntry.getCode())
	}
}
