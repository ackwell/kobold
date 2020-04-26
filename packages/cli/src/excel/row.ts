export interface RowConstructor<T extends Row> {
	new (): T
	sheet: string
}

export class Row {
	static get sheet(): string {
		throw new Error(`Missing \`static sheet\` declaration on ${this.name}.`)
	}
	get sheet() {
		return (this.constructor as typeof Row).sheet
	}

	protected unknown() {}
	protected number() {}
}

// this shouldn't be here but fucking whatever right now tbqh
export class Status extends Row {
	static sheet = 'Status'

	// column defs - let's see if this is a good idea
	name = this.unknown()
	description = this.unknown()
	icon = this.number()
}
