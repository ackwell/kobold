module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	env: {es6: true},
	globals: {process: true},
	plugins: [
		'@typescript-eslint',
		'prettier',
	],
	rules: {
		'prettier/prettier': 'error',
	}
}