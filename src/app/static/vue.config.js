const path = require("path");
const { defineConfig } = require("@vue/cli-service");
const webpack = require('webpack');


module.exports = defineConfig({
    transpileDependencies: true,
    outputDir: path.resolve(__dirname, './public'),
    css: {
        extract: {
            filename: "css/app.css"
        }
    },
    configureWebpack: {
        optimization: {
            splitChunks: false
        },
        mode: "development",
        output: {
            filename: 'js/app.js',
            chunkFilename: 'js/[name].chunk.js',
            hotUpdateChunkFilename: "hot/[name].hot-update.js",
            hotUpdateMainFilename: "hot/hot-update.json"
        },
        devServer: {
            devMiddleware: {
                writeToDisk: true
            },
            watchFiles: {
                options: {
                    ignored: ["node_modules", "public", "src/tests"]
                }
            },
            port: 3000,
        },
        performance: {
            hints: false
        },
        devtool: 'eval-source-map',
        plugins: [
            new webpack.DefinePlugin({
                // Vue CLI is in maintenance mode, and probably won't fix this in their tooling
                // see PR for more context https://github.com/vuejs/vue-cli/pull/7443
                __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
            })
        ],
    }
});
