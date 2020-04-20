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
		const segments = path.split('/') as Partial<string[]>

		const category = segments[0]
		assert(category != null)

		let repository = segments[1]
		if (repository != null && !this.repositories.has(repository)) {
			repository = this.defaultRepository
		}
		assert(repository != null)

		const fileDetails = {category, repository}

		return fileDetails
	}
}
