/* global module */
module.exports = {
	exclude: ['node_modules/**'],
	presets: [
		['@babel/preset-env', {targets: {node: '10'}}],
		'@babel/preset-typescript',
	],
	plugins: [
		[
			'@babel/plugin-transform-runtime',
			{corejs: {version: 3, proposals: true}},
		],
		'@babel/plugin-proposal-class-properties',
	],
	babelrcRoots: ['.', 'packages/*'],
}
