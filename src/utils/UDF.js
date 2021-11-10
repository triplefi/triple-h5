
/* eslint-disable */
const FirstData = require('./data').default

function Dep() {
  this.handles = {};
}

Dep.prototype = { // 观察者模式
  constructor: Dep,

  sub: function (handle, callback) { // 添加事件
    if (typeof handle !== 'string') {
      throw new Error('handle must be a string!');
    }
    if (!this.handles[handle]) {
      this.handles[handle] = [];
    }
    // 这样做可能会导致内存泄漏，待观察
    // this.handles[handle] = [];
    this.handles[handle].push(callback);
  },

  unSub: function (handle) { // 删除事件
    var that = this;
    if (this.handles[handle]) {
      this.handles[handle].forEach(function (item, index) {
        that.handles[handle][index] = null;
      });
      this.handles[handle] = null;
    }
  },

  pub: function () { // 发布事件
    if (!arguments[0] || typeof arguments[0] !== 'string') {
      throw new Error('the first param must be a string!');
    }
    var handles = this.handles[arguments[0]];
    if (handles && handles.length > 0) {
      var arg = Array.prototype.slice.call(arguments, 1);
      handles.forEach(function (handleItem) {
        if (typeof handleItem === 'function') {
          handleItem.apply(null, arg);
        }
      });
    }
  }
};

// 过滤对象数组去重   arr是数组，field是参考字段, 回调是后续可以对数组进行其他操作，已去重后的数组为参数，并需要返回处理后的数组。
function duplicateRemoval(arr, field, callback) {
  var hash = {};
  arr = arr.reduce(function (item, next) {
    hash[next[field]] ? '' : hash[next[field]] = true && item.push(next);
    return item;
  }, []);

  if (callback) {
    arr = callback(arr);
  }

  return arr;
}

// 格式化数据
function formatBarData(data) {
  if (!data) {
    return [];
  }
  if (typeof data === 'string') {
    data = JSON.parse(data);
  }
  if (data.constructor !== Array) {
    throw new Error('data must be an array!');
  }
  var ret = [];
  var tempObj = {};
  data = duplicateRemoval(data, 'time');
  data.forEach(function (item) {
    tempObj = {
      time: item.time,
      close: item.close,
      open: item.open,
      high: item.high,
      low: item.low,
      volume: 0,
      isBarClosed: true,
      isLastBar: false
    };
    // console.log(tempObj, '---00000');
    ret.push(tempObj);
  });
  return ret;
}
const oneData = [{ "open": 62182.7, "high": 62336.57, "low": 62169.27, "close": 62176.93, "time": 1636257600000, "vol": 11.91780, "currencyVol": 741889.7186540 }]

export default class UDFCompatibleDatafeed {
  /**
   * UDFCompatibleDatafeed 类
   * @param { object } dataSuorce 依赖ws
   * @param {*} updateFrequency *
   * @param { object } config 绘图配置
   * @param { object } businessData 交易对信息
   */
  constructor(dataSource, vue, config, businessData) {
    // this.DataProvider = dataSource;
    this._ws = dataSource;
    this._config = config;
    this._businessConf = businessData;
    this._vue = vue;
    this._dep = new Dep();
    this.isTooNear = false;
    this.preData = [];
    this.subscriberID = null;
    this.getBarsTimer = null;
    this.onResetCacheNeededCallback = function () { };
  }

  onReady(callback) {
    if (typeof this._config !== 'object') {
      throw new Error('UDFCompatibleDatafeed config need an object!!');
    }
    var that = this;
    setTimeout(function () {
      callback(that._config);
    }, 0);

    // var sourceData = formatBarData(FirstData);
    // sourceData[0].isBarClosed = true;
    // sourceData[0].isLastBar = false;
    // that.preData = JSON.parse(JSON.stringify(sourceData));
    // console.log(sourceData)
    // that._dep.pub('firstData', sourceData);

    // setInterval(() => {
    //   var sourceData = formatBarData(oneData)
    //   var prevLen = that.preData.length;
    //   var curLen = sourceData.length;

    //   // 如果是当前交易对的更新数据判断随后一条k线时间与最新消息时间，如果最新消息时间比最新k线时间还小就舍弃
    //   if (prevLen > 0 && curLen === 1 && that.preData[prevLen - 1].time > sourceData[0].time) {
    //     return false;
    //   }
    //   sourceData[0].isBarClosed = true;
    //   sourceData[0].isLastBar = false;
    //   that.preData = JSON.parse(JSON.stringify(sourceData));
    //   that._dep.pub('newData', sourceData);
    // }, 1000)

    return false;
  }

  /**
   * 用户搜索时,提供一个匹配用户搜索的商品列表
   * @param { string } userInput 用户在商品搜索框中输入的文字
   * @param { string } exchange 请求的交易所（由用户选择）。空值表示没有指定
   * @param { string } symbolType 请求的商品类型：指数、股票、外汇等等（由用户选择）。空值表示没有指定
   */
  searchSymbols(userInput, exchange, symbolType, onResultReadyCallback) {
    onResultReadyCallback([]);
  }

  // 通过商品名称解析商品信息
  resolveSymbol(symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    var that = this;
    setTimeout(function () {
      onSymbolResolvedCallback(that._businessConf.symbolResolveConf);
    }, 0);
    return false;
  }

  /**
   * 通过商品名称解析商品信息，切换interval（时间）时也会调用
   */
  getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
    var that = this;
    console.log('firstDataRequest', firstDataRequest)
    if (!firstDataRequest) {
      onHistoryCallback([], { noData: true });
      that._vue.$emit('chartReady');
    } else {
      var sourceData = formatBarData(FirstData);
      sourceData[0].isBarClosed = true;
      sourceData[0].isLastBar = false;
      that.preData = JSON.parse(JSON.stringify(sourceData));
      onHistoryCallback(sourceData);
      that._vue.$emit('chartReady');
    }
  }

  subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    // this._dep.sub('newData', function (data) {
    //   // 更新最后一条K线
    //   if (data.constructor === Array) {
    //     data = data[0];
    //   }
    //   onRealtimeCallback(data);
    // });
    var that = this
    setInterval(() => {
      var data = JSON.parse(JSON.stringify(oneData))
      data[0].vol = 0
      data[0].close = data[0].close + Math.random() * 100
      var sourceData = formatBarData(data)
      var prevLen = that.preData.length;
      var curLen = sourceData.length;

      // 如果是当前交易对的更新数据判断随后一条k线时间与最新消息时间，如果最新消息时间比最新k线时间还小就舍弃
      if (prevLen > 0 && curLen === 1 && that.preData[prevLen - 1].time > sourceData[0].time) {
        return false;
      }
      sourceData[0].isBarClosed = true;
      sourceData[0].isLastBar = false;
      that.preData = JSON.parse(JSON.stringify(sourceData));
      // that._dep.pub('newData', sourceData);
      onRealtimeCallback(sourceData[0]);
    }, 1000)
  }

  unsubscribeBars(subscriberUID) {
    // this._dep.unSub('newData');
  }
  // 处理深度
  calculateHistoryDepth(resolution, resolutionBack, intervalBack) {
    return undefined;
  }
};
