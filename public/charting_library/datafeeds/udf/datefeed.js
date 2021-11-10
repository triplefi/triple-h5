// 获取对应时间的毫秒数
/* function getMS (interval) {
  var ms = 0;

  if (!isNaN(interval)) {
    ms = mtoms(interval);
  }
  if (interval.indexOf('D') > -1) {
    var d = parseInt(interval) ? parseInt(interval) : 1;
    ms = mtoms(d * 24 * 60);
  }
  if (interval.indexOf('W') > -1) {
    var w = parseInt(interval) ? parseInt(interval) : 1;
    ms = mtoms(w * 7 * 24 * 60);
  }
  if (interval.indexOf('M') > -1) {
    // 按照默认30天算
    var m = parseInt(interval) ? parseInt(interval) : 1;
    ms = mtoms(m * 30 * 7 * 24 * 60);
  }

  // 分钟转毫秒
  function mtoms (m) {
    return m * 60 * 1000;
  }

  return ms;
} */

function Dep () {
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
function duplicateRemoval (arr, field, callback) {
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
function formatBarData (data, resolution) {
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
      volume: item.vol,
      isBarClosed: true,
      isLastBar: false
    };
    // console.log(tempObj, '---00000');
    ret.push(tempObj);
  });
  return ret;
}

/**
 * UDFCompatibleDatafeed 类
 * @param { object } dataSuorce 依赖ws
 * @param {*} updateFrequency *
 * @param { object } config 绘图配置
 * @param { object } businessData 交易对信息
 */
function UDFCompatibleDatafeed (dataSource, vue, config, businessData) {
  this.DataProvider = dataSource;
  this._config = config;
  this._businessConf = businessData;
  this._vue = vue;
  this._dep = new Dep();
  this.isTooNear = false;
  this.preData = [];
  this.isWSOpen = false;
  this.subscriberID = null;
  this.getBarsTimer = null;
  this.onResetCacheNeededCallback = function () {};
}

UDFCompatibleDatafeed.prototype = {
  constructor: UDFCompatibleDatafeed,

  onReady: function (callback) {
    if (typeof this._config !== 'object') {
      throw new Error('UDFCompatibleDatafeed config need an object!!');
    }
    var that = this;
    setTimeout(function () {
      callback(that._config);
    }, 0);
    that._ws = new that.DataProvider({
      url: that._businessConf.wsURL
    });
    that._ws.opt.onMsgCall = function (data) {
      // console.log('ws recieve msg: ', data);
      var sourceData = formatBarData(data.data, that._businessConf.interval);
      var prevLen = that.preData.length;
      var curLen = sourceData.length;

      that._vue.$emit('chartReady');
      // if (curLen < 0) {
      //   return false;
      // }
      // console.log(that.preData[prevLen - 1], sourceData[0], 'asdfasdf');
      // 如果是当前交易对的更新数据判断随后一条k线时间与最新消息时间，如果最新消息时间比最新k线时间还小就舍弃
      if (prevLen > 0 && !data.success && curLen === 1 && that.preData[prevLen - 1].time > sourceData[0].time) {
        // console.log(345);
        return false;
      }
      that.preData = JSON.parse(JSON.stringify(sourceData));
      // 连上ws后或切换交易对时，判断首次数据
      if (sourceData.length >= 0 && data.success) {
        // sourceData.splice(sourceData.length - 1, 1);
        that._dep.pub('firstData', sourceData);
      } else if (curLen === 1) {
        sourceData[0].isBarClosed = true;
        sourceData[0].isLastBar = false;
        // console.log(sourceData);
        that._dep.pub('newData', sourceData);
      }
    };
    that._ws.opt.onOpenCall = function () {
      that.isWSOpen = true;
      // console.log('ws open');
    };
    return false;
  },

  /**
   * 用户搜索时,提供一个匹配用户搜索的商品列表
   * @param { string } userInput 用户在商品搜索框中输入的文字
   * @param { string } exchange 请求的交易所（由用户选择）。空值表示没有指定
   * @param { string } symbolType 请求的商品类型：指数、股票、外汇等等（由用户选择）。空值表示没有指定
   */
  searchSymbols: function (userInput, exchange, symbolType, onResultReadyCallback) {
    onResultReadyCallback([]);
  },

  // 通过商品名称解析商品信息
  resolveSymbol: function (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) {
    var that = this;
    setTimeout(function () {
      onSymbolResolvedCallback(that._businessConf.symbolResolveConf);
    }, 0);
    return false;
  },

  /**
   * 通过商品名称解析商品信息，切换interval（时间）时也会调用
   */
  getBars: function (symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
    var that = this;
    function gogo () {
      if (!firstDataRequest) {
        onHistoryCallback([], {noData: true});
        return true;
      }
      if (that.isWSOpen) {
        that._dep.sub('firstData', function (data) {
          // var cbParams = null;
          // if (data.length > 0) {
          //   cbParams = {noData: true, nextTime: (data[data.length - 1].time + getMS(resolution))};
          //   onHistoryCallback(data);
          //   // that._dep.unSub('firstData');
          // } else {
          //   // onErrorCallback('nothing to render!');
          //   onHistoryCallback(data);
          // }
          onHistoryCallback(data);
          that._dep.unSub('firstData');
        });
        that._ws.sendMsg('[{"type":"subHq_cancel_all","event":"kline"}]');
        setTimeout(function () {
          that._ws.sendMsg(JSON.stringify([{type: 'subHq', event: 'kline', param: {businessType: that._businessConf.symbolResolveConf.description, kType: that._businessConf.chart.resolutionsToKtype[resolution], size: that._businessConf.wsMsg.size}}]));
        }, 0);
        clearTimeout(that.getBarsTimer);
      } else {
        that.getBarsTimer = setTimeout(gogo, 200);
      }
    }
    gogo();
    // if (firstDataRequest) {
    //   this._dep.sub('firstData', function (data) {
    //     console.log('firstData----');
    //     // 绘制历史K线
    //     // console.log(getMS(resolution));
    //     var cbParams = null;
    //     if (data.length > 0) {
    //       cbParams = {noData: true, nextTime: (data[data.length - 1].time + getMS(resolution))};
    //       onHistoryCallback(data, cbParams);
    //       // that._dep.unSub('firstData');
    //     } else {
    //       // onErrorCallback('nothing to render!');
    //       onHistoryCallback(data, cbParams);
    //     }
    //   });
    // } else {
    //   onHistoryCallback([], {noData: true});
    // }
    return true;
  },

  subscribeBars: function (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
    this._dep.sub('newData', function (data) {
      // 更新最后一条K线
      if (data.constructor === Array) {
        data = data[0];
      }
      onRealtimeCallback(data);
    });
  },

  unsubscribeBars: function (subscriberUID) {
    // this._dep.unSub('newData');
  },
  // 处理深度
  calculateHistoryDepth: function (resolution, resolutionBack, intervalBack) {
    return undefined;
  }
};
