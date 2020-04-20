import fs from 'fs'
import path from 'path'
import util from 'util'
import {Kobold} from './kobold'

const asyncReadDir = util.promisify(fs.readdir)

// These should be configurable on cli and such
const sqpackPath =
	'C:\\Program Files (x86)\\SquareEnix\\FINAL FANTASY XIV - A Realm Reborn\\game\\sqpack'

async function main() {
	const kobold = new Kobold()

	const repoDirs = await asyncReadDir(sqpackPath)
	for (const repoDir of repoDirs) {
		kobold.loadRepository({name: repoDir, path: path.join(sqpackPath, repoDir)})
	}

	console.log(kobold)

	const rootExl = kobold.getFile('exd/root.exl')
	console.log(rootExl)
}
main()
