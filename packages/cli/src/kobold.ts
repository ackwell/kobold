import {Repository} from './repository'

class SqpackPath {
	private path: string

	constructor(opts: {path: string}) {
		this.path = opts.path
	}
}

export class Kobold {
	private repositories = new Map<string, Repository>()

	loadRepository(opts: {name: string; path: string}) {
		this.repositories.set(opts.name, new Repository(opts))
	}

	getFile(path: string) {
		const filePath = new SqpackPath({path})

		return filePath
	}
}
