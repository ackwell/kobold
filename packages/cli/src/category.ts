// TODO: Configurable?
const categoryMap = new Map([
	['common', 0x00],
	['bgcommon', 0x01],
	['bg', 0x02],
	['cut', 0x03],
	['chara', 0x04],
	['shader', 0x05],
	['ui', 0x06],
	['sound', 0x07],
	['vfx', 0x08],
	['ui_script', 0x09],
	['exd', 0x0a],
	['game_script', 0x0b],
	['music', 0x0c],
	['sqpack_test', 0x12],
	['debug', 0x13],
])

export class Category {
	private name: string
	private repositoryPath: string

	constructor(opts: {name: string; repositoryPath: string}) {
		this.name = opts.name
		this.repositoryPath = opts.repositoryPath

		console.log(categoryMap.get(this.name))
	}
}
