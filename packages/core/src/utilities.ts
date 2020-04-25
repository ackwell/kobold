import {strict as nodeAssert} from 'assert'

// TODO: Use node's `assert` module directly once DefinitelyTyped#42786 is merged
export function assert(
	condition: boolean,
	message?: string,
): asserts condition {
	nodeAssert(condition, message)
}
