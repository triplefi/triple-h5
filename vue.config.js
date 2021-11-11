// vue.config.js
module.exports = {
  devServer: {
    host: '127.0.0.1',
    port: '8080',
    overlay: {
      warnings: false,
      errors: true,
    },
    proxy: {
      '/': {
        ws: true,
        target: 'http://api.triple.fi',
        secure: false,
        changeOrigin: true,
      },
      '/ws': {
        ws: true,
        target: 'ws://api.triple.fi',
        changeOrigin: true,
      },
    },
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
          symbolId: 'icon-[name]',
        }
        return options
      })
  },
}
