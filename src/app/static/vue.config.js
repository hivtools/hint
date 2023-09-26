const path = require("path");
const { defineConfig } = require("@vue/cli-service");

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
    }
});