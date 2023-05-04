const path = require("path");
const { defineConfig } = require("@vue/cli-service");

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
        // plugins: [new MiniCssExtractPlugin({
        //     filename: "css/app.css"
        // })],
        // module: {
        //     rules: [
        //         {
        //             test: /\.s[ac]ss$/i,
        //             use: [
        //                 "style-loader",
        //                 MiniCssExtractPlugin.loader,
        //                 "css-loader",
        //                 "sass-loader",
        //             ]
        //         }
        //     ]
        // },
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