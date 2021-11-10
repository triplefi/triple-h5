<template>
  <div id="tv_chart_container" class="tvCointainer"></div>
</template>
<script>
import WS from "@/utils/wsUtil";
import UDFCompatibleDatafeed from "@/utils/UDF";
export default {
  data() {
    return {
      initData: {},
      canSendNext: true,
      klineWS: null,
      tvWidget: null,
    };
  },
  props: {
    chartParams: {
      required: true,
    },
    themeOptions: {
      required: true,
    },
    symbol: {
      required: true,
    },
  },
  created() {},
  mounted() {
    this.initTV();
  },
  /**
   * TradingView 源码修改记录
   * 1、去掉tradingview logo右侧的文字，修改的文件zh.json， “charts by TradingView”
   * 2、修改同步请求至异步.open("GET",t,true)
   */
  methods: {
    initTV() {
      console.log("initTv");
      this.setDataFeed(); // 获取TradingView置数据和k线数据
      if (window.TradingView) {
        this.initDatafeed(); // 初始化TradingView
      } else {
        // 防止js加载慢导致Tradingview相关js还没加载到就执行对应代码
        /* eslint-disable no-undef */
        window.onload = () => {
          TradingView.onready(() => {
            this.initDatafeed();
          });
        };
      }
    },
    // 根据k线配置渲染k线
    initDatafeed() {
      let that = this;
      /* eslint-disable no-undef */
      /* eslint-disable new-cap */
      that.tvWidget = new TradingView.widget({
        // debug: true, // 开发时打开，打包时关闭
        width: "100%",
        height: "100%",
        // preset: 'mobile',
        symbol: that.symbol, // 交易对
        interval: that.chartParams.interval, // 默认k线间隔
        container_id: "tv_chart_container",
        datafeed: that.datafeed, // 数据
        toolbar_bg: that.themeOptions.bgColor, // 上方工具栏背景
        timezone: "Asia/Shanghai",
        library_path: "/charting_library/charting_library/",
        locale: "en", // 语言
        drawings_access: {
          type: "black",
          tools: [{ name: "Regression Trend" }],
        },
        // charts_storage_api_version: '1.1',
        // client_id: 'tradingview.com',
        user_id: "public_user_id",
        loading_screen: { backgroundColor: that.themeOptions.bgColor },
        enabled_features: that.chartParams.showLeftBar
          ? [
              "move_logo_to_main_pane",
              "keep_left_toolbar_visible_on_small_screens",
            ]
          : ["move_logo_to_main_pane"],
        disabled_features: [
          // 禁用功能
          // 'left_toolbar',
          "control_bar",
          "volume_force_overlay",
          "header_compare",
          "timeframes_toolbar",
          "header_undo_redo",
          "header_saveload",
          "header_interval_dialog_button",
          "header_symbol_search",
          "use_localstorage_for_settings",
        ],
        has_no_volume: false, // 是否显示交易量
        favorites: {
          intervals: that.chartParams.resolutions, // k线间隔列表
        },
        custom_css_url: that.themeOptions.custom_css_url, // 自定义样式文件路径
        overrides: {
          // k线样式
          volumePaneSize: "medium",
          "timeScale.rightOffset": 10,

          "paneProperties.background": that.themeOptions.bgColor,
          "paneProperties.vertGridProperties.color":
            that.themeOptions.vertGridColor, // 网格线颜色垂直方向
          "paneProperties.vertGridProperties.style": 0,
          "paneProperties.horzGridProperties.color":
            that.themeOptions.horzGridColor, // 网格线颜色水平方向
          "paneProperties.horzGridProperties.style": 0,
          "paneProperties.topMargin": 12,
          "paneProperties.bottomMargin": 5,
          "paneProperties.crossHairProperties.color":
            that.themeOptions.crossHairColor, // 十字线
          "paneProperties.crossHairProperties.width": 1,
          "paneProperties.crossHairProperties.style": 0,

          "symbolWatermarkProperties.color": "rgba(0,0,0,0)",

          "scalesProperties.backgroundColor": "#fff",
          "scalesProperties.showLeftScale": false, // 左侧刻度不显示
          "scalesProperties.showRightScale": true, // 右侧刻度显示
          "scalesProperties.fontSize": 11,
          "scalesProperties.lineColor": that.themeOptions.lineColor, // 坐标线颜色
          "scalesProperties.textColor": that.themeOptions.scaleTextColor, // 右侧刻度值颜色
          "scalesProperties.scaleSeriesOnly": true,
          "scalesProperties.showSeriesLastValue": true,
          "scalesProperties.showSeriesPrevCloseValue": false,
          "scalesProperties.showStudyLastValue": false,
          "scalesProperties.showStudyPlotLabels": false,
          "scalesProperties.showSymbolLabels": false, // 控制是否在当前价格label中显示币名
          "mainSeriesProperties.visible": true,

          // 蜡烛样式
          "mainSeriesProperties.candleStyle.upColor": that.themeOptions.upColor, // 阳线背景色
          "mainSeriesProperties.candleStyle.downColor":
            that.themeOptions.downColor, // 阴线背景色
          "mainSeriesProperties.candleStyle.drawWick": true, // 灯芯
          "mainSeriesProperties.candleStyle.drawBorder": false, // 蜡烛边框
          "mainSeriesProperties.candleStyle.borderColor": "#fff", // 蜡烛边框颜色
          "mainSeriesProperties.candleStyle.borderUpColor":
            that.themeOptions.upColor, // 阳线边框色
          "mainSeriesProperties.candleStyle.borderDownColor":
            that.themeOptions.downColor, // 阴线边框色
          "mainSeriesProperties.candleStyle.wickUpColor":
            that.themeOptions.wickUpColor, // 上影线颜色
          "mainSeriesProperties.candleStyle.wickDownColor":
            that.themeOptions.wickDownColor, // 下影线颜色
          // 'mainSeriesProperties.candleStyle.barColorsOnPrevClose': false,

          "paneProperties.legendProperties.showStudyArguments": false,
          "paneProperties.legendProperties.showStudyTitles": false, // 线 study control
          "paneProperties.legendProperties.showStudyValues": false,
          "paneProperties.legendProperties.showSeriesTitle": false, // 控制显示左上角是否显示当前交易对
          "paneProperties.legendProperties.showSeriesOHLC": true, // 控制显示开高低收
        },
        studies_overrides: {
          "volume.volume.color.0": that.themeOptions.downColor,
          "volume.volume.color.1": that.themeOptions.upColor,
        },
      });

      that.tvWidget.onChartReady(() => {
        // console.log('onChartReady');
        // this.$emit('chartReady');
        // k线时间间隔改变callback
        that.tvWidget
          .chart()
          .onIntervalChanged()
          .subscribe(null, (interval, obj) => {
            if (!this.canSendNext) {
              return false;
            }
            this.canSendNext = false;
            // 限制点击频率
            setTimeout(() => {
              this.canSendNext = true;
            }, 300);
            that.chartParams.interval = interval;
          });
      });
    },
    // 设置k线配置
    setDataFeed() {
      let that = this;
      this.initData = {
        interval: that.chartParams.interval,
        wsURL: "wss://www.bitforex.com/mkapi/coinGroup1/ws", // ws2.BitForex.com ${window.WS_DOMAIN} wss://ws.BitForex.com
        // 建立ws链接后首次订阅消息
        wsMsg: {
          wsMsgType: "subHq",
          businessType: that.symbol,
          kType: that.chartParams.interval + "min",
          size: 1440,
        },
        chart: {
          resolutions: that.chartParams.resolutions,
          resolutionsToKtype: that.chartParams.resolutionsToKtype,
        },
        // symbol 配置
        symbolResolveConf: {
          name: that.symbol,
          minmov: 1,
          minmov2: 0,
          pointvalue: 1,
          session: "0000-2359:1234567", // 交易日配置
          has_intraday: true, // 是否有日内数据
          description: that.symbol,
          type: "stock", // 股票
          exchange: "BitForex", // 交易所
          supported_resolutions: that.chartParams.resolutions,
          intraday_multipliers: that.chartParams.resolutions, // 这是一个包含日内分辨率(分钟单位)的数组，激活分钟,要想取到多少分钟需要在这同时设置
          pricescale: that.chartParams.pricescale || 10000, // 右侧数价格精度
          // has_weekly_and_monthly: true,
          has_daily: true,
          has_seconds: true,
          ticker: that.symbol,
          volume_precision: 3, // 交易量精度
          timezone: "Asia/Shanghai", // 时区

          seconds_multipliers: ["1s", "5s"],
          has_empty_bars: true,
        },
      };
      // this.klineWS = new WS({
      //   url: this.initData.wsURL,
      // });
      // 数据
      this.datafeed = new UDFCompatibleDatafeed(
        // this.klineWS,
        undefined,
        this,
        {
          // 自定义实现的接口，处理数据
          supports_search: true,
          supports_group_request: true,
          supported_resolutions: that.initData.chart.resolutions,
          // intraday_multipliers: that.initData.chart.resolutions,
          supports_marks: true,
          supports_timescale_marks: true,
        },
        that.initData
      );
    },
    delWs() {
      let cancelSubMsg = '[{"type":"subHq_cancel_all","event":"kline"}]';
      if (this.klineWS && this.klineWS.ws && this.klineWS.ws.readyState >= 1) {
        this.klineWS.sendMsg(cancelSubMsg);
        this.klineWS.closeConnect();
        this.klineWS = null;
      }
    },
  },
  watch: {
    // locale (curVal, oldVal) {
    //   try {
    //     this.tvWidget.chart().setLanguage(curVal);
    //   } catch (e) {
    //     console.log(e);
    //   }
    // },
    themeOptions: {
      handler(curVal, oldVal) {
        // this.tvWidget.showLoadChartDialog();
        this.tvWidget.applyOverrides({
          "paneProperties.background": curVal.bgColor,
          "paneProperties.vertGridProperties.color": curVal.vertGridColor, // 网格线颜色垂直方向
          "paneProperties.horzGridProperties.color": curVal.horzGridColor, // 网格线颜色水平方向
          "paneProperties.crossHairProperties.color": curVal.crossHairColor, // 十字线
          "scalesProperties.lineColor": curVal.lineColor, // 坐标线颜色
          "scalesProperties.textColor": curVal.scaleTextColor, // 右侧刻度值颜色

          // 蜡烛样式
          "mainSeriesProperties.candleStyle.upColor": curVal.upColor, // 阳线背景色
          "mainSeriesProperties.candleStyle.downColor": curVal.downColor, // 阴线背景色
          "mainSeriesProperties.candleStyle.borderUpColor":
            curVal.borderUpColor, // 阳线边框色
          "mainSeriesProperties.candleStyle.borderDownColor": curVal.downColor, // 阴线边框色
          "mainSeriesProperties.candleStyle.wickUpColor": curVal.wickUpColor, // 上影线颜色
          "mainSeriesProperties.candleStyle.wickDownColor":
            curVal.wickDownColor, // 下影线颜色
        });
        this.tvWidget.addCustomCSSFile(curVal.custom_css_url);
      },
    },
  },
  beforeDestroy() {
    this.delWs();
  },
};
</script>
<style lang="scss" scoped>
.tvCointainer {
  width: 100%;
  height: 100%;
}
</style>
