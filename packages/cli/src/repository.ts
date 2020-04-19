const CategoryMap = new Map([
	['common' ,0x00],
	['bgcommon' ,0x01],
	['bg' ,0x02],
	['cut' ,0x03],
	['chara' ,0x04],
	['shader' ,0x05],
	['ui' ,0x06],
	['sound' ,0x07],
	['vfx' ,0x08],
	['ui_script' ,0x09],
	['exd' ,0x0A],
	['game_script' ,0x0B],
	['music' ,0x0C],
	['sqpack_test' ,0x12],
	['debug' ,0x13],
])

export class Repository {
	constructor(opts: {
		path: string,
		name: string,
	}) {
		console.log(opts)
	}
}