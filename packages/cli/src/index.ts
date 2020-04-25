import fs from 'fs'
import path from 'path'
import util from 'util'
import {assert} from './utilities'
import {Kobold} from '@kobold/core'
import {ExcelList, ExcelHeader} from './excel'

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

	// method arg lmao
	const sheetName = 'Status'

	const rootExl = await kobold.getFile('exd/root.exl', ExcelList)
	assert(rootExl != null)

	// Make sure the sheet (technically) exists
	assert(
		rootExl.sheets.has(sheetName),
		`Sheet ${sheetName} is not listed in the root excel list.`,
	)

	// TODO: Sheet cache

	const excelHeader = await kobold.getFile(`exd/${sheetName}.exh`, ExcelHeader)
	assert(excelHeader != null)
	console.log(excelHeader)
}
main().catch(e => {
	console.error(e.stack)
	process.exit(1)
})
