<p align="center"><img src="../../kobold.png?raw=true" alt="kobold" height="200"></p>
<h1 align="center">@kobold/excel</h1>

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