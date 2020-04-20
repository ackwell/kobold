import {strict as nodeAssert} from 'assert'

export const isDefined = <T>(value?: T | null): value is T => value != null

// TODO: Use node's `assert` module directly once DefinitelyTyped#42786 is merged
export function assert(condition: boolean): asserts condition {
	nodeAssert(condition)
}
