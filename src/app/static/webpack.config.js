var path = require('path');
var webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const minimalLoaderRules = [
    {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
            loaders: {
                // Since sass-loader (weirdly) has SCSS as its default parse mode, we map
                // the "scss" and "sass" values for the lang attribute to the right configs here.
                // other preprocessors should work out of the box, no loader config like this necessary.
                'scss': 'vue-style-loader!css-loader!sass-loader',
                'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            }
            // other vue-loader options go here
        }
    },
    {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
            appendTsSuffixTo: [/\.vue$/],
        }
    }];

const commonConfig = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    module: {
        rules: [
            ...minimalLoaderRules,
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]?[hash]'
                }
            },
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.ftl$/,
                use: [
                    {
                        loader: 'html-loader'
                    }
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js', '.vue', '.json'],
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
        }
    },
    devServer: {
        historyApiFallback: true,
        noInfo: true
    },
    performance: {
        hints: false
    },
    devtool: '#eval-source-map',
    plugins: [
        // make sure to include the plugin for the magic
        new VueLoaderPlugin()
    ]
};

const appConfig = {
    ...commonConfig,
    entry: './src/app/index.ts',
    output: {
        path: path.resolve(__dirname, './public'),
        publicPath: '/public/',
        filename: 'js/app.js'
    },
    plugins: [...commonConfig.plugins,
        new HtmlWebpackPlugin({
            hash: true,
            template: 'public/index.ftl',
            filename: 'index.ftl'
        })
    ]
};

const forgotPasswordAppConfig = {
    ...commonConfig,
    entry: './src/app/forgotPassword.ts',
    output: {
        path: path.resolve(__dirname, './public'),
        publicPath: '/public/',
        filename: 'js/forgotPassword.js'
    },
    plugins: [...commonConfig.plugins,
        new HtmlWebpackPlugin({
            hash: true,
            template: 'public/forgot-password.ftl',
            filename: 'forgot-password.ftl'
        })
    ]
};

const resetPasswordAppConfig = {
    ...commonConfig,
    entry: './src/app/resetPassword.ts',
    output: {
        path: path.resolve(__dirname, './public'),
        publicPath: '/public/',
        filename: 'js/resetPassword.js'
    },
    plugins: [...commonConfig.plugins,
        new HtmlWebpackPlugin({
            hash: true,
            template: 'public/reset-password.ftl',
            filename: 'reset-password.ftl'
        })
    ]
};

const loginAppConfig = {
    ...commonConfig,
    module: {
        rules: [
            ...minimalLoaderRules,
            {
                test: /\.ftl$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: {
                            attrs: false
                        }
                    }
                ]
            }]
    },
    entry: './src/app/login.ts',
    output: {
        path: path.resolve(__dirname, './public'),
        publicPath: '/public/',
        filename: 'js/login.js'
    },
    plugins: [...commonConfig.plugins,
        new HtmlWebpackPlugin({
            hash: true,
            template: 'public/login.ftl',
            filename: 'login.ftl'
        })
    ]
};

module.exports = [appConfig, forgotPasswordAppConfig, resetPasswordAppConfig, loginAppConfig];

if (process.env.NODE_ENV === 'production') {
    module.exports.forEach((moduleExport) => {
        moduleExport.devtool = '#source-map';
        // http://vue-loader.vuejs.org/en/workflow/production.html
        moduleExport.plugins = (moduleExport.plugins || []).concat([
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: '"production"'
                }
            }),
            new webpack.LoaderOptionsPlugin({
                minimize: true
            })
        ])
    });
}
