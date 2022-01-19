// vue.config.js
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
module.exports = {
    devServer: {
        host: '127.0.0.1',
        port: '8080',
        https: true,
        overlay: {
            warnings: false,
            errors: true
        },
        proxy: {
            '/api': {
                ws: true,
                target: 'https://triple.fi',
                secure: true,
                changeOrigin: true
            }
            // '/wss': {
            //     ws: true,
            //     target: 'wss://triple.fi/wss',
            //     changeOrigin: true
            // }
        }
        // before: require('./mock/mock-server.js')
    },
    chainWebpack: (config) => {
        const svgRule = config.module.rule('svg')

        // 清除已有的所有 loader。
        // 如果你不这样做，接下来的 loader 会附加在该规则现有的 loader 之后。
        svgRule.uses.clear()

        // 添加要替换的 loader
        svgRule
            .use('svg-sprite-loader')
            .loader('svg-sprite-loader')
            .tap((options) => {
                options = {
                    symbolId: 'icon-[name]'
                }
                return options
            })
    },
    configureWebpack: (config) => {
        if (process.env.NODE_ENV === 'production') {
            // 为生产环境修改配置...
            config.optimization.minimizer.push(
                new UglifyJsPlugin({
                    uglifyOptions: {
                        compress: {
                            drop_console: false
                        }
                    }
                })
            )
        } else {
            // 为开发环境修改配置...
        }
    }
}
