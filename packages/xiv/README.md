<p align="center"><img src="https://github.com/ackwell/kobold/raw/master/kobold.png?raw=true" alt="kobold" height="200"></p>
<h1 align="center">@kobold/xiv</h1>
<p align="center">
	<a href="https://www.npmjs.com/package/@kobold/xiv" title="NPM"><img src="https://img.shields.io/npm/v/@kobold/xiv?style=flat-square" alt="NPM"></a>
</p>

Utilities for using Kobold with Final Fantasy XIV.

## Getting Started
```ts
// Build an instance of kobold pre-loaded with settings appropriate for reading
// data from a local installation of FFXIV
const kobold = buildKoboldXIV()

// If you have the game installed in an unusual location, you may need to pass
// the path to the installation manually
const alsoKobold = buildKoboldXIV({path: 'C:\\weird-path\\Final Fantasy XIV'})
```