import {assert} from './utilities'
import {Category} from './category'

export class Repository {
	private readonly path: string
	private readonly name: string

	private readonly categories = new Map<string, Category>()

	constructor(opts: {path: string; name: string}) {
		this.path = opts.path
		this.name = opts.name
	}

	getFile(path: string) {
		// TODO: Maybe consolidate file details into an object/class?
		const [catName] = path.split('/', 1) as Partial<string[]>
		assert(catName != null)

		let category = this.categories.get(catName)
		if (category == null) {
			category = new Category({
				name: catName,
				repositoryPath: this.path,
			})
			this.categories.set(catName, category)
		}

		console.log(`REPO(${this.name}): getFile ${path} in ${catName}:`, category)
	}
}
