import fs from 'fs'
import path from 'path'
import util from 'util'
import {Repository} from './repository'

const asyncReadDir = util.promisify(fs.readdir)

// These should be configurable on cli and such
const sqpackPath =
	'C:\\Program Files (x86)\\SquareEnix\\FINAL FANTASY XIV - A Realm Reborn\\game\\sqpack'

async function main() {
	const repoDirs = await asyncReadDir(sqpackPath)
	const repos = new Map<string, Repository>()
	for (const repoDir of repoDirs) {
		repos.set(
			repoDir,
			new Repository({
				path: path.join(sqpackPath, repoDir),
				name: repoDir,
			}),
		)
	}

	const arr = repos.get('ffxiv')
	console.log(arr)
}
main()
