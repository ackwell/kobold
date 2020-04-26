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
		'import',
	],
	extends: [
		'plugin:import/typescript'
	],
	rules: {
		'prettier/prettier': 'error',
		'import/order': ['error', {
			groups: [
				['builtin', 'external', 'internal'],
				'parent',
				['sibling', 'index'],
			],
			alphabetize: {order: 'asc'}
		}]
	}
}