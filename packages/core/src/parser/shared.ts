import {Parser} from 'binary-parser'

export type InternalKeys = '__start' | '__current'

export type Parsed<P extends Parser<any>> = Omit<
	ReturnType<P['parse']>,
	InternalKeys
>
