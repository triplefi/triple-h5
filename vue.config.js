// vue.config.js
const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const PrerenderSPAPlugin = require('prerender-spa-plugin')
const Renderer = PrerenderSPAPlugin.PuppeteerRenderer
module.exports = {
    // publicPath: '/',
    devServer: {
        host: '127.0.0.1',
        port: '8080',
        https: true,
        overlay: {
            warnings: false,
            errors: true
        }
        // proxy: {
        //     '/api': {
        //         ws: true,
        //         target: 'https://polygon.triple.fi',
        //         secure: true,
        //         changeOrigin: true
        //     }
        // '/wss': {
        //     ws: true,
        //     target: 'wss://triple.fi/wss',
        //     changeOrigin: true
        // }
        // }
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
                }),
                // 预渲染，SEO优化
                new PrerenderSPAPlugin({
                    staticDir: path.join(__dirname, 'dist'),
                    routes: ['/'], // 你需要预渲染的路由
                    renderer: new Renderer({
                        // inject: {
                        //     _m: 'prerender'
                        // },
                        // 渲染时显示浏览器窗口，调试时有用
                        headless: true,
                        // 等待触发目标时间后，开始预渲染
                        renderAfterDocumentEvent: 'render-event'
                    })
                })
            )
        } else {
            config.devtool = 'source-map'
            // 为开发环境修改配置...
            // 预渲染，SEO优化
            new PrerenderSPAPlugin({
                staticDir: path.join(__dirname, 'dist'),
                routes: ['/'], // 你需要预渲染的路由
                renderer: new Renderer({
                    // inject: {
                    //     _m: 'prerender'
                    // },
                    // 渲染时显示浏览器窗口，调试时有用
                    headless: true,
                    // 等待触发目标时间后，开始预渲染
                    renderAfterDocumentEvent: 'render-event'
                })
            })
        }
    }
}
