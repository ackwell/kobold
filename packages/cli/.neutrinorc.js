module.exports = {
	use: [
		require('@neutrinojs/node')({
			hot: false,

			babel: {
				presets: [
					'@babel/preset-typescript',
				],
			},
		}),

		neutrino => {
			neutrino.config.resolve.extensions.add('.ts').add('.tsx')
			neutrino.config.module.rule('compile').test(/\.(mjs|jsx?|tsx?)/)
		},
	]
}