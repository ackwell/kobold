import {Path} from './path'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'
import util from 'util'
import {parseSqpackIndex} from './parser/sqpackIndex'

const asyncReadFile = util.promisify(fs.readFile)

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
		const parsed = parseSqpackIndex(indexBuffer)

		// temp test
		const hashes = new Map<bigint, number>()
		for (const entry of parsed.indexes) {
			hashes.set(entry.hash, entry.offset)
		}

		const offset = hashes.get(pathInfo.index)
		if (offset) {
			console.log(
				`found offset for ${pathInfo.path} (${pathInfo.index}): ${offset}`,
			)
		}
	}
}
