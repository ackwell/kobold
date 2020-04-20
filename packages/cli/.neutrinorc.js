module.exports = {
	use: [
		require('@neutrinojs/eslint')({
			eslint: {
				baseConfig: {
					parser: '@typescript-eslint/parser',
					plugins: [
						'@typescript-eslint',
						'prettier',
					],
					extends: [
					],
					rules: {
						'prettier/prettier': 'error',
					},
				},
			},
		}),

		require('@neutrinojs/node')({
			hot: false,

			babel: {
				presets: [
					'@babel/preset-typescript',
				],
				plugins: [
					'@babel/plugin-proposal-class-properties'
				],
			},
		}),

		neutrino => {
			neutrino.config.resolve.extensions.add('.ts').add('.tsx')
			neutrino.config.module.rule('compile').test(/\.(mjs|jsx?|tsx?)/)
		},
	]
}