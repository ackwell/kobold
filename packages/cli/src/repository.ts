export class Repository {
	private readonly path: string
	private readonly name: string

	constructor(opts: {path: string; name: string}) {
		this.path = opts.path
		this.name = opts.name
	}
}
