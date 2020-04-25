module.exports = {
	exclude: ['node_modules/**'],
	presets: [
		['@babel/preset-env', {useBuiltIns: 'entry', corejs: 3}],
		'@babel/preset-typescript',
	],
	plugins: [
		['@babel/plugin-transform-runtime', {corejs: 3}],
		'@babel/plugin-proposal-class-properties',
	],
	babelrcRoots: ['.', 'packages/*'],
}
