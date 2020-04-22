import {crc} from './crc'

export class Path {
	readonly category: number
	readonly repository: string
	readonly path: string

	private _index?: bigint

	constructor(opts: {category: number; repository: string; path: string}) {
		this.category = opts.category
		this.repository = opts.repository
		this.path = opts.path
	}

	get indexHash() {
		if (this._index) {
			return this._index
		}

		// todo: cache
		const lastSlash = this.path.lastIndexOf('/')
		const folder = this.path.substr(0, lastSlash)
		const file = this.path.substr(lastSlash + 1)

		const folderHash = crc(folder)
		const fileHash = crc(file)

		const index = (folderHash << 32n) | fileHash
		this._index = index
		return index
	}
}
