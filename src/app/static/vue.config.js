const path = require("path");
const { defineConfig } = require("@vue/cli-service");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = defineConfig({
    // transpileDependencies: true,
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
        // mode: "development",
        output: {
            filename: 'js/app.js',
            chunkFilename: "js/[name].chunk.js",
        // hotUpdateChunkFilename: "hot/[name].hot-update.js",
        // hotUpdateMainFilename: "hot/hot-update.json"
        },
        // plugins: [
        //     new HtmlWebpackPlugin({
        //         template: 'templates/index.ftl',
        //         filename: 'index.ftl'
        //     })
        // ],
        // noInfo: true,
        performance: {
            hints: false
        },
        devtool: 'eval-source-map',
        // module: {
        //     rules: [
        //       {
        //         test: /\.s[ac]ss$/i,
        //         use: [
        //           // Creates `style` nodes from JS strings
        //           "style-loader",
        //           // Translates CSS into CommonJS
        //           "css-loader",
        //           // Compiles Sass to CSS
        //           "sass-loader",
        //         ],
        //       },
        //     ],
        //   },
    }
});