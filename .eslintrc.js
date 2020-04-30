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
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:import/recommended',
		'plugin:import/typescript',
	],
	rules: {
		'@typescript-eslint/array-type': 'error',
		'@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/member-delimiter-style': 'off',
		'@typescript-eslint/method-signature-style': 'error',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-use-before-define': 'off',

		'prettier/prettier': 'error',

		'import/first': 'error',
		'import/newline-after-import': 'error',
		'import/no-default-export': 'error',
		'import/no-internal-modules': 'error',
		'import/order': ['error', {
			groups: [
				['builtin', 'external', 'internal'],
				'parent',
				['sibling', 'index'],
			],
			alphabetize: {order: 'asc'}
		}],
	},
}