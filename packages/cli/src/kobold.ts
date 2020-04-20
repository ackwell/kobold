import {Repository} from './repository'
import {assert} from './utilities'

export class Kobold {
	private repositories = new Map<string, Repository>()
	private defaultRepository?: string

	loadRepository(opts: {name: string; path: string; default?: boolean}) {
		this.repositories.set(opts.name, new Repository(opts))
		if (opts.default) {
			this.defaultRepository = opts.name
		}
	}

	getFile(path: string) {
		// TODO: Maybe consolidate file details into an object/class?
		const segments = path.split('/', 2) as Partial<string[]>

		let repoName = segments[1]
		assert(repoName != null, `Path "${path}" is malformed.`)
		if (repoName != null && !this.repositories.has(repoName)) {
			assert(
				this.defaultRepository != null,
				`"${repoName}" is not a valid repository, and no default repository is configured.`,
			)
			repoName = this.defaultRepository
		}

		const repository = this.repositories.get(repoName)
		assert(repository != null)

		repository.getFile(path)
	}
}
