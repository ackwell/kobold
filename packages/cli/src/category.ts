import {Path} from './path'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'
import util from 'util'
import {parseSqpackIndex, IndexHashTableEntry} from './parser/sqpackIndex'

const asyncReadFile = util.promisify(fs.readFile)

// TODO: Most of this should be broken out into CategoryChunk handling
export class Category {
	private readonly categoryId: number
	private readonly repositoryPath: string

	private _indexes?: Promise<Map<bigint, IndexHashTableEntry>>

	constructor(opts: {categoryId: number; repositoryPath: string}) {
		this.categoryId = opts.categoryId
		this.repositoryPath = opts.repositoryPath
	}

	private async buildIndexes() {
		if (this._indexes != null) {
			return this._indexes
		}

		// Find index files
		const idPrefix = this.categoryId.toString(16).padStart(2, '0').slice(0, 2)
		// const indexFiles = await glob(`${idPrefix}????.*.index{2,}`, {
		const indexFiles = await glob(`${idPrefix}????.*.index`, {
			cwd: this.repositoryPath,
			caseSensitiveMatch: false,
		})

		// TODO: Check > 0 index (chunks)

		const tempIndexFname = indexFiles[0]
		const tempIndexPath = path.join(this.repositoryPath, tempIndexFname)

		const indexBuffer = await asyncReadFile(tempIndexPath)
		const parsed = parseSqpackIndex(indexBuffer)

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
		if (entry) {
			console.log(
				`found offset for ${pathInfo.path} (${pathInfo.indexHash}):`,
				entry,
			)
		}
	}
}
