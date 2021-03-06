<p align="center"><img src="https://github.com/ackwell/kobold/raw/master/kobold.png?raw=true" alt="kobold" height="200"></p>
<h1 align="center">@kobold/excel</h1>
<p align="center">
	<a href="https://www.npmjs.com/package/@kobold/excel" title="NPM"><img src="https://img.shields.io/npm/v/@kobold/excel?style=flat-square" alt="NPM"></a>
</p>

Excel (EXD) sheet reader module for Kobold.

## Getting Started
```ts
// Set up the excel module instance
const excel = new Excel({kobold})

// Define the shape of the sheet you wish to read
class Status extends Row {
	static sheet = 'Status'

	name = this.string()
	description = this.string()
	// ...etc
}

// Load the sheet
const statuses = await excel.getSheet(Status)

// Read in a row
const requiescat = await statuses.getRow(1368)

// ...or lots of them
for await (const status of statuses.getRows({from: 1000, to: 3000})) {
	// do stuff
}
```