<template>
  <!-- v-loading="!ready" -->
  <div class="kline" >
    <!-- v-if="ready" -->
    <c-tv
      class="tvCon active"
      @chartReady="onChartReady"
      @wsData="onWsData"
      :chartParams="chartParams"
      :themeOptions="themeOptions"
      :symbol="symbol"
    />
  </div>
</template>
<script>
import cTv from "./tv.vue";

import { mapState, mapGetters } from "vuex";
export default {
  data() {
    return {
      showLoading: true,
      // 在data里面定义的是进入页面是默认的chart数据
      chartParams: {
        // 功能相关配置
        interval: "30", // 默认时间k线
        resolutions: ["1", "5", "15", "30", "60", "120", "240", "D", "W", "M"],
        resolutionsToKtype: {
          1: "1min",
          5: "5min",
          15: "15min",
          30: "30min",
          60: "1hour",
          120: "2hour",
          240: "4hour",
          D: "1day",
          W: "1week",
          M: "1month"
        },
        pricescale: 10000,
        showLeftBar: true
      },
      theme: "black",
      themeColors: {
        white: "#fff",
        black: "#0A0911",
        green: "#103640",
        gray: "#232835"
      }
    };
  },
  components: {
    cTv
  },
  computed: {
    ...mapState(["ready", "token0Decimals"]),
    ...mapGetters(["symbol"]),
    themeOptions() {
      if (this.theme === "white") {
        return {
          waterMarkColor: "rgba(255, 255, 255, 0)",
          bgColor: "#fff",
          vertGridColor: "rgba(0,0,0,0.05)",
          horzGridColor: "rgba(0,0,0,0.05)",
          crossHairColor: "rgba(0,0,0,0.3)",
          lineColor: "rgba(126,143,165,0.50)",
          scaleTextColor: "rgba(0,0,0,0.50)",
          upColor: "#0F9D58",
          wickUpColor: "#0F9D58",
          downColor: "#D23F31",
          wickDownColor: "#D23F31",
          custom_css_url: "white.css"
        };
      } else {
        return {
          waterMarkColor: "rgba(255, 0, 0, 0.15)",
          bgColor: this.themeColors[this.theme],
          vertGridColor: "rgba(255,255,255,0.05)",
          horzGridColor: "rgba(255,255,255,0.05)",
          crossHairColor: "rgba(255,255,255,0.3)",
          lineColor: "rgba(255,255,255,0.2)",
          scaleTextColor: "rgba(255,255,255,0.4)",
          upColor: "#2FAD68",
          downColor: "#D88161",
          wickUpColor: "#5FC94F",
          wickDownColor: "#EB6A5A",
          custom_css_url: `${this.theme}.css` // 在/lib/charting_library/static/目录下
        };
      }
    }
  },
  created() {},
  mounted() {
    this.ready && this.setChartParams();
  },
  methods: {
    onChartReady() {
      this.showLoading = false;
    },
    onWsData(data) {
      // console.log('wssssssssssssssss', data);
    },
    setChartParams() {
      this.chartParams.pricescale = Math.pow(
        10,
        this.decimals * 1 + this.amountDecimal * 1
      );
    }
  },
  watch: {
    ready(curVal, oldVal) {
      if (curVal) {
        this.setChartParams();
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.kline {
  ::v-deep .el-loading-mask {
    right: 1px;
    bottom: 1px;
    background-color: var(--COLOR-bg1) !important;
  }
}
</style>
