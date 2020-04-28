import {File} from './file'
import {Path} from './path'
import {Repository} from './repository'
import {assert} from './utilities'

export class Kobold {
	private categoryIdMap = new Map<string, number>()

	private repositories = new Map<string, Repository>()
	private defaultRepository?: string

	addCategories(categories: Record<string, number>) {
		Object.entries(categories).forEach(([name, id]) =>
			this.addCategory(name, id),
		)
	}

	addCategory(name: string, id: number) {
		this.categoryIdMap.set(name, id)
	}

	addRepository(opts: {name: string; path: string; default?: boolean}) {
		this.repositories.set(opts.name, new Repository(opts))
		if (opts.default) {
			this.defaultRepository = opts.name
		}
	}

	async getFile<T extends File>(
		stringOrPath: string | Path,
		FileClass: new (opts: {data: Buffer}) => T,
	) {
		const fileBuffer = await this.getFileRaw(stringOrPath)

		return new FileClass({data: fileBuffer})
	}

	// TODO: Might be worth refactoring Buffer->DataView so we're not quite so tied to node?
	getFileRaw(stringOrPath: string | Path) {
		const path =
			typeof stringOrPath === 'string'
				? this.parsePath(stringOrPath)
				: stringOrPath

		const repository = this.repositories.get(path.repository)
		assert(repository != null)

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
