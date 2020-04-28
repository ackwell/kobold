import {Kobold} from '@kobold/core'
import {Excel, Row} from '@kobold/excel'
import fs from 'fs'
import path from 'path'
import util from 'util'

const asyncReadDir = util.promisify(fs.readdir)

// TODO: These should be configurable on cli and such
const sqpackPath =
	'C:\\Program Files (x86)\\SquareEnix\\FINAL FANTASY XIV - A Realm Reborn\\game\\sqpack'

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

async function main() {
	const kobold = new Kobold()
	kobold.setCategories(categoryMap)

	const repoDirs = await asyncReadDir(sqpackPath)
	for (const repoDir of repoDirs) {
		kobold.addRepository({
			name: repoDir,
			path: path.join(sqpackPath, repoDir),
			default: repoDir === 'ffxiv',
		})
	}

	const excel = new Excel({kobold})
	const sheet = await excel.getSheet(Status)
	console.log(await sheet.getRow(103))
}
main().catch(e => {
	console.error(e.stack)
	process.exit(1)
})

// this shouldn't be here but fucking whatever right now tbqh
export class Status extends Row {
	static sheet = 'Status'

	// column defs - let's see if this is a good idea
	name = this.string()
	description = this.string()
	icon = this.number()
	maxStacks = this.number()
	// unknown UINT_8
	category = this.number({column: 5})
	hitEffect = this.number()
	vfx = this.number()
	lockMovement = this.boolean()
	lockActions = this.boolean()
	// unknown PACKED_BOOL_2
	lockControl = this.boolean({column: 11})
	transfiguration = this.boolean()
	// unknown PACKED_BOOL_5
	canDispel = this.boolean({column: 14})
	inflictedByActor = this.boolean()
	isPermanent = this.boolean()
	partyListPriority = this.number()
	// unknown PACKED_BOOL_1
	// unknown PACKED_BOOL_2
	// unknown INT_16
	// unknown UINT_8
	// unknown PACKED_BOOL_3
	log = this.number({column: 23})
	isFcBuff = this.boolean()
	invisiblity = this.boolean()
	// unknown UINT_8
	// unknown UINT_8
	// unknown PACKED_BOOL_6
}
