import {crc} from './crc'

export class Path {
	readonly category: number
	readonly repository: string
	readonly path: string

	private _index?: bigint
	private _index2?: bigint

	constructor(opts: {category: number; repository: string; path: string}) {
		this.category = opts.category
		this.repository = opts.repository
		this.path = opts.path
	}

	get indexHash() {
		if (this._index) {
			return this._index
		}

		const lastSlash = this.path.lastIndexOf('/')
		const folder = this.path.substr(0, lastSlash)
		const file = this.path.substr(lastSlash + 1)

		const folderHash = crc(folder)
		const fileHash = crc(file)

		const index = (folderHash << 32n) | fileHash
		this._index = index
		return index
	}

	get index2Hash() {
		if (this._index2) {
			return this._index2
		}

		const index2 = crc(this.path)
		this._index2 = index2
		return index2
	}
}
