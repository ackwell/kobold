import {Path} from './path'
import glob from 'fast-glob'
import path from 'path'
import fs from 'fs'
import util from 'util'

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
		console.log(indexBuffer.slice(0, 8).toString())
	}
}
