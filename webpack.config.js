'use strict';

const NODE_ENV = process.env.NODE_ENV || 'development';
const webpack = require('webpack');
const SftpWebpackPlugin = require('sftp-webpack-plugin')

console.log(NODE_ENV)
module.exports = {
    entry: __dirname + '/src/app',
    output: {
      filename: __dirname + '/public/build.js',
      library: 'app'
    },

    watch: NODE_ENV === 'development',

    watchOptions: {
        aggragateTimeout: 100
    },

    devtool: NODE_ENV === 'development' ? 'cheap-inline-module-source-map' : 'source-map',

    plugins:[
        new webpack.NoErrorsPlugin(),
        new webpack.DefinePlugin({
            NODE_ENV: JSON.stringify(NODE_ENV),
            LANG: JSON.stringify('ru')
        }),
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /ru|en/) 
    ],
    
    resolve: {
        modulesDirectories: ['node_modules'],
        extensions: ['', '.js', '.ts']
    },

    resolveLoader: {
        modulesDirectories: ['node_modules'],
        moduleTemplates: ['*-loader', '*'],
        extensions: ['', '.js']
    }, 

    module : {
        loaders:[{
            test: /\.js$/,
            loader: 'babel?presets[]=es2015'
        },
        { 
            test: /\.tsx?$/, 
            loader: 'ts-loader' 
        }]
    }
}

if(NODE_ENV === 'production'){
    module.exports.plugins.push(
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                // don't show unreachable variables etc
                warnings: false,
                drop_console: true,
                unsafe: true
            }
        })
    );
}