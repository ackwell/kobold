export class Path {
	category: number
	repository: string
	path: string

	constructor(opts: {category: number; repository: string; path: string}) {
		this.category = opts.category
		this.repository = opts.repository
		this.path = opts.path
	}
}
