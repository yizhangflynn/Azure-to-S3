module.exports = {
    mode: 'production',
    entry: './main.ts',
    output: { filename: '[name].bundle.js' },
    target: 'node',
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: 'ts-loader'
            }
        ]
    }
};
