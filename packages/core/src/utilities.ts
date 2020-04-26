import {strict as nodeAssert} from 'assert'

// TODO: Use node's `assert` module directly once DefinitelyTyped#44117/types-publisher#772 is fixed
export function assert(
	condition: boolean,
	message?: string,
): asserts condition {
	nodeAssert(condition, message)
}
