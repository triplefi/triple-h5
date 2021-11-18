/* eslint-disable */
import { getTradeKline } from '@/api'

// 格式化单条数据
function formatBarItem(data, pricescale) {
  if (!data) {
    return {}
  }
  if (data.constructor !== Array) {
    console.error('data must be an array!')
    return []
  }
  const [open, high, low, close, time] = data
  return {
    open: open / pricescale,
    high: high / pricescale,
    low: low / pricescale,
    close: close / pricescale,
    time: time * 1000,
    volume: 0,
    isBarClosed: true,
    isLastBar: false,
  }
}
// 格式化多条数据
function formatBarData(data, pricescale) {
  if (!data) {
    return []
  }
  if (typeof data === 'string') {
    data = JSON.parse(data)
  }
  if (data.constructor !== Array) {
    console.error('data must be an array!')
    return []
  }
  var ret = []
  var tempObj = {}
  data.forEach((item) => {
    const [open, high, low, close, time] = item
    tempObj = {
      open: open / pricescale,
      high: high / pricescale,
      low: low / pricescale,
      close: close / pricescale,
      time: time * 1000,
      volume: 0,
      isBarClosed: true,
      isLastBar: false,
    }
    ret.push(tempObj)
  })
  return ret
}
// resolutions 转成接口 type
const resolutionsToKtype = {
  1: 'm1',
  5: 'm5',
  10: 'm10',
  15: 'm15',
  30: 'm30',
  60: 'h1',
  120: 'h2',
  240: 'h4',
  360: 'h6',
  720: 'h12',
  D: 'd1',
  // W: "1week",
  // M: "1month",
}
export default class UDFCompatibleDatafeed {
  /**
   * UDFCompatibleDatafeed 类
   * @param { object } dataSuorce 依赖ws
   * @param {*} updateFrequency *
   * @param { object } config 绘图配置
   * @param { object } businessData 交易对信息
   */
  constructor(dataSource, vue, config, businessData) {
    this._ws = dataSource
    this._config = config
    this._businessConf = businessData
    this._vue = vue
    this.isTooNear = false
    this.preData = []
    this.subscriberID = null
    this.getBarsTimer = null
    this.onResetCacheNeededCallback = () => {}
  }

  onReady(callback) {
    if (typeof this._config !== 'object') {
      throw new Error('UDFCompatibleDatafeed config need an object!!')
    }
    setTimeout(() => {
      callback(this._config)
    }, 0)
    return false
  }

  /**
   * 用户搜索时,提供一个匹配用户搜索的商品列表
   * @param { string } userInput 用户在商品搜索框中输入的文字
   * @param { string } exchange 请求的交易所（由用户选择）。空值表示没有指定
   * @param { string } symbolType 请求的商品类型：指数、股票、外汇等等（由用户选择）。空值表示没有指定
   */
  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    onResultReadyCallback([])
  }

  // 通过商品名称解析商品信息
  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    setTimeout(() => {
      onSymbolResolvedCallback(this._businessConf.symbolResolveConf)
    }, 0)
    return false
  }

  /**
   * 通过商品名称解析商品信息，切换interval（时间）时也会调用
   */
  getBars(
    symbolInfo,
    resolution,
    from,
    to,
    onHistoryCallback,
    onErrorCallback,
    firstDataRequest,
  ) {
    console.log('firstDataRequest', firstDataRequest, symbolInfo)
    if (!firstDataRequest) {
      onHistoryCallback([], { noData: true })
    } else {
      getTradeKline({
        contract: symbolInfo.ticker,
        type: resolutionsToKtype[resolution],
        count: 2000,
      }).then((res) => {
        console.log('getTradeKline', res)
        if (res.result) {
          var sourceData = formatBarData(res.data, symbolInfo.pricescale)
          this.preData = JSON.parse(JSON.stringify(sourceData))
          onHistoryCallback(sourceData, { noData: false })
          this._vue.$emit('chartReady')
        }
      })

      let timer = setInterval(() => {
        if (this._ws.isWsOpen()) {
          clearTimeout(timer)
          setTimeout(() => {
            this._ws.sendMsg(
              `${symbolInfo.ticker}:${resolutionsToKtype[resolution]}`,
            )
          }, 0)
        }
      }, 200)
    }
  }

  subscribeBars(
    symbolInfo,
    resolution,
    onRealtimeCallback,
    subscriberUID,
    onResetCacheNeededCallback,
  ) {
    this._ws.opt.onMsgCall = (data) => {
      if (data) var sourceData = formatBarItem(data, symbolInfo.pricescale)
      var prevLen = this.preData.length
      var curLen = sourceData.length

      // 如果是当前交易对的更新数据判断随后一条k线时间与最新消息时间，如果最新消息时间比最新k线时间还小就舍弃
      if (
        prevLen > 0 &&
        curLen === 1 &&
        this.preData[prevLen - 1].time > sourceData[0].time
      ) {
        return false
      }
      this.preData = JSON.parse(JSON.stringify(sourceData))
      console.log('subscribeBars', sourceData)
      onRealtimeCallback(sourceData)
    }
  }

  unsubscribeBars(subscriberUID) {}
  // 处理深度
  calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
    return undefined
  }
}
