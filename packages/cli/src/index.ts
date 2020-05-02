import {Excel, Row, Language} from '@kobold/excel'
import {buildKoboldXIV} from '@kobold/xiv'

async function main() {
	const kobold = await buildKoboldXIV()

	const excel = new Excel({kobold})
	const statuses = await excel.getSheet(Status, {language: Language.GERMAN})
	console.log(await statuses.getRow(103))

	const arrangements = await excel.getSheet(AOZArrangement)
	for await (const arrangement of arrangements.getRows()) {
		console.log(
			`${arrangement.index}:${arrangement.subIndex} - ${arrangement.contentBriefingBNPC}, ${arrangement.unknown1}`,
		)
	}
}
main().catch(e => {
	console.error(e.stack)
	process.exit(1)
})

// this shouldn't be here but fucking whatever right now tbqh
class Status extends Row {
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
	// unknown PACKED_BOOL_2
	lockActions = this.boolean({column: 10})
	lockControl = this.boolean()
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

class AOZArrangement extends Row {
	static sheet = 'AOZArrangement'

	contentBriefingBNPC = this.number()
	unknown1 = this.number()
}
