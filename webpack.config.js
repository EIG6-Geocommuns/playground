const path = require("path");

let config = {
    entry: {
        bundle: [ './src/index.ts' ],
    },
    module: {
        rules : [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            // https://webpack.js.org/guides/asset-modules/
            {
                test: /\.(vert|frag)$/,
                type: 'asset/source'
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    devtool: 'source-map',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './public/libs'),
        library: '[name]'
    },
    devServer: {
        devMiddleware: {
            publicPath:  path.resolve(__dirname, './public'),
            writeToDisk: true,
        },
        static: path.resolve(__dirname, './public'),
        client: {
            overlay: {
                errors: true,
                warnings: false,
            },
        },
        hot: false,
        // historyApiFallback: true,
        // open: true,
    }
}

function buildConfig(env) {
    config.mode = (env === 'development' || env === 'production') ? env : 'development';
    return config;
}

module.exports = buildConfig;
