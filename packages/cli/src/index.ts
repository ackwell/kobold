import {Kobold} from '@kobold/core'
import {Parser} from 'binary-parser'
import fs from 'fs'
import path from 'path'
import util from 'util'
import {ExcelList, ExcelHeader, Variant, ExcelData} from './excel'
import {assert} from './utilities'

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

// TODO: where should this live? is it composed by excel, or is it handled as part of the data file reader itself?
const rowHeaderParser = new Parser()
	.endianess('big')
	.uint32('dataSize')
	.uint16('rowCount')

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

	// TODO: Sort out subrows
	assert(excelHeader.variant === Variant.DEFAULT)

	// TODO: Don't hardcode this
	// exd/{sheetName}_{page}[_{languageString}].exd
	const excelDataPage = await kobold.getFile(
		`exd/${sheetName}_0_en.exd`,
		ExcelData,
	)
	assert(excelDataPage != null)

	const testRow = 9
	const testColumn = 20

	const testRowOffset = excelDataPage.rowOffsets.get(testRow)
	assert(testRowOffset != null)

	const testColumnOffset = excelHeader.columns[testColumn]?.offset
	assert(testColumnOffset != null)

	// @ts-ignore
	const rowHeaderSize = rowHeaderParser.sizeOf()

	const testOffset = testRowOffset + testColumnOffset + rowHeaderSize
	const test = excelDataPage.data.readInt16BE(testOffset)
	console.log(test)
}
main().catch(e => {
	console.error(e.stack)
	process.exit(1)
})
