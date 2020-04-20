import {Category} from './category'
import {Path} from './path'

export class Repository {
	private readonly path: string
	private readonly name: string

	private readonly categories = new Map<number, Category>()

	constructor(opts: {path: string; name: string}) {
		this.path = opts.path
		this.name = opts.name
	}

	getFile(path: Path) {
		let category = this.categories.get(path.category)
		if (category == null) {
			category = new Category({
				categoryId: path.category,
				repositoryPath: this.path,
			})
			this.categories.set(path.category, category)
		}

		category.getFile(path)
	}
}
