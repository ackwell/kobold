import {File} from './file'
import {Path} from './path'
import {Repository} from './repository'
import {assert} from './utilities'

export class Kobold {
	private categoryIdMap = new Map<string, number>()

	private repositories = new Map<string, Repository>()
	private defaultRepository?: string

	// TODO: Probably should merge
	setCategories(categoryIdMap: Map<string, number>) {
		this.categoryIdMap = categoryIdMap
	}

	addRepository(opts: {name: string; path: string; default?: boolean}) {
		this.repositories.set(opts.name, new Repository(opts))
		if (opts.default) {
			this.defaultRepository = opts.name
		}
	}

	async getFile<T extends File>(
		stringOrPath: string | Path,
		FileClass: new ({data}: {data: Buffer}) => T,
	) {
		const fileBuffer = await this.getFileRaw(stringOrPath)
		if (fileBuffer == null) {
			return
		}

		const file = new FileClass({data: fileBuffer})

		return file
	}

	getFileRaw(stringOrPath: string | Path) {
		const path =
			typeof stringOrPath === 'string'
				? this.parsePath(stringOrPath)
				: stringOrPath

		const repository = this.repositories.get(path.repository)
		assert(repository != null)

		// TODO: Map file buffer to a file type reader?
		return repository.getFile(path)
	}

	private parsePath(path: string): Path {
		const [catName, maybeRepoName] = path.split('/', 3) as Partial<string[]>
		assert(
			catName != null && maybeRepoName != null,
			`Path ${path} is malformed.`,
		)

		const catId = this.categoryIdMap.get(catName)
		assert(catId != null, `No mapping found for category "${catName}".`)

		const repoName = this.repositories.has(maybeRepoName)
			? maybeRepoName
			: this.defaultRepository
		assert(
			repoName != null,
			`No mapping found for repository "${maybeRepoName}", and no default repository is configured.`,
		)

		return new Path({category: catId, repository: repoName, path})
	}
}
