<p align="center"><img src="https://github.com/ackwell/kobold/raw/master/kobold.png?raw=true" alt="kobold" height="200"></p>
<h1 align="center">@kobold/core</h1>
<p align="center">
	<a href="https://www.npmjs.com/package/@kobold/core" title="NPM"><img src="https://img.shields.io/npm/v/@kobold/core?style=flat-square" alt="NPM"></a>
</p>

Core logic for extracting data from SqPack repositories.

**NOTE:** If you intend to read data from Final Fantasy XIV, It's strongly recommended you make use of the [`@kobold/xiv`](../xiv) utility package to automate much of the below.

## Getting Started
```ts
const kobold = new Kobold()

// Add "repositories" - these are the top-level groupings of files, often associated
// with expansions and similar
kobold.addRepository({
	name: 'ffxiv',
	path: 'C:\\path\\to\\sqpack\\ffxiv',
	default: true,
})

// Add "categories" - these are the _types_ of content expected within the SqPacks,
// spanning multiple repositories, such as "exd"
kobold.addCategory('exd', 0x0A)

// Load the file!
const fileBuffer = kobold.loadFileRaw('exd/root.exl')

// Or, load it into a file class to be parsed
class ExcelList extends File {
	constructor({data}: {data: Buffer}) {
		super()

		// ... parse the data ...
	}
}

const rootList = kobold.loadFile('exd/root.exl', ExcelList)
```