import {Kobold} from '@kobold/core'
import fs from 'fs'
import path from 'path'
import util from 'util'

const asyncAccess = util.promisify(fs.access)
const asyncReadDir = util.promisify(fs.readdir)

/* eslint-disable @typescript-eslint/camelcase */
const categories = {
	common: 0x00,
	bgcommon: 0x01,
	bg: 0x02,
	cut: 0x03,
	chara: 0x04,
	shader: 0x05,
	ui: 0x06,
	sound: 0x07,
	vfx: 0x08,
	ui_script: 0x09,
	exd: 0x0a,
	game_script: 0x0b,
	music: 0x0c,
	sqpack_test: 0x12,
	debug: 0x13,
}
/* eslint-enable @typescript-eslint/camelcase */

// Stolen from goatcorp. Pls2not sic lawyers.
const tryPaths = [
	'C:\\SquareEnix\\FINAL FANTASY XIV - A Realm Reborn',
	'C:\\Program Files (x86)\\Steam\\steamapps\\common\\FINAL FANTASY XIV Online',
	'C:\\Program Files (x86)\\Steam\\steamapps\\common\\FINAL FANTASY XIV - A Realm Reborn',
	'C:\\Program Files (x86)\\FINAL FANTASY XIV - A Realm Reborn',
	'C:\\Program Files (x86)\\SquareEnix\\FINAL FANTASY XIV - A Realm Reborn',
]
const sqPackDir = path.join('game', 'sqpack')

export async function buildKoboldXIV(opts?: {path?: string}) {
	const sqPackPath = await getSqPackPath(opts?.path)

	// Get the list of game data repositories
	let repoDirs
	try {
		repoDirs = await asyncReadDir(sqPackPath)
	} catch {
		throw new Error(
			`Could not read SqPack dir at "${sqPackPath}". Please ensure you have a valid installation of FFXIV.`,
		)
	}

	// _All_ xiv installations will have at least the ffxiv repo - if it's missing, something is wrong
	if (!repoDirs.includes('ffxiv')) {
		throw new Error(
			`SqPack dir "${sqPackPath}" does not contain the base "ffxiv" repository. Please ensure you have a valid installation of FFXIV.`,
		)
	}

	// Build up the actual kobold instance :meowpraise:
	const kobold = new Kobold()
	kobold.addCategories(categories)
	for (const repoDir of repoDirs) {
		kobold.addRepository({
			name: repoDir,
			path: path.join(sqPackPath, repoDir),
			default: repoDir === 'ffxiv',
		})
	}

	return kobold
}

async function getSqPackPath(providedPath?: string) {
	let gamePath = providedPath

	if (gamePath == null) {
		// They haven't provided a path, try to find one
		try {
			gamePath = await Promise.any(
				tryPaths.map(tryPath => asyncAccess(tryPath).then(() => tryPath)),
			)
		} catch {
			/* noop */
		}
	}

	if (gamePath == null) {
		throw new Error(
			'Could not find FFXIV. Please specify an absolute path to your installation.',
		)
	}

	return path.join(gamePath, sqPackDir)
}
