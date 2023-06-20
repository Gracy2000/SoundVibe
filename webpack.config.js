const path = require('path');

module.exports = {
    entry: {
        app: './src/app.js'
    },
    mode: "development",
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'app.bundled.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }

            }
        ]
    },
    devServer: {
       static: {
         directory: path.join(__dirname, 'dist'),
       },
       port: 9000,
       open: true
    }
}