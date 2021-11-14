<template>
  <div class="market">
    <div class="title">
      <span class="btn14">Select Market</span>
      <div class="line"></div>
    </div>
    <div class="search">
      <div class="search-input">
        <svg-icon
          icon-class="ic_Search"
          class-name="icon-search"
        ></svg-icon>
        <input
          class="input fs14"
          type="text"
          placeholder="Search 67 Currency..."
          v-model="query"
        />
      </div>
      <div class="curreny">
        <div class="fs14b">ETH</div>
        <div class="fs14b active">USDT</div>
        <div class="fs14b">USDC</div>
        <div class="fs14b">DAI</div>
      </div>
    </div>
    <div class="coins">
      <div
        class="coin"
        :class="[
            checkActive(item)
            ? 'active'
            : '',
          item.index_price - item.open_price >= 0 ? 'up' : 'dw'
        ]"
        v-for="item in list"
        :key="item.trade_coin"
        @click="checkActive(item) && selectPair(item)"
      >
        <img
          class="icon"
          :src="
            require(`@/assets/coin/coin_${item.trade_coin.toUpperCase()}.png`)
          "
          alt=""
        />
        <span class="btn13">{{ item.trade_coin.toUpperCase() }}</span>
        <span class="fs13 code"></span>
        <span class="btn13 price">${{item.index_price}}</span>
        <div class="btn13 rate">
          {{item.index_price - item.open_price >= 0 ? '+' : ''}}{{((item.index_price - item.open_price) / item.open_price * 100).toFixed(2)}}%
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getTradePairs } from "@/api";
import { mapActions } from "vuex";
export default {
  name: "Market",
  data() {
    return {
      query: "",
      list: [],
      interval: null,
    };
  },
  watch: {
    web3: {
      handler(n) {
        n && this.list.length && this.init();
      },
      immediate: true,
    },
  },
  async created() {
    const res = await getTradePairs();
    if (res.result) {
      this.list = res.data;
    }
    this.web3 && this.list.length && this.init();
  },
  mounted() {
    this.interval = setInterval(() => {
      this.getList();
    }, 3000);
  },
  beforeDestroy() {
    this.interval && clearInterval(this.interval);
  },
  methods: {
    ...mapActions(["initContract"]),
    async getList() {
      const res = await getTradePairs();
      if (res.result) {
        this.list = res.data;
      }
    },
    init() {
      const pairInfo = localStorage.getItem("pairInfo");
      if (pairInfo) {
        this.selectPair(JSON.parse(pairInfo));
      } else {
        this.selectPair(this.list[0]);
      }
    },
    selectPair(item) {
      console.log("selectPair", item);
      localStorage.setItem("pairInfo", JSON.stringify(item));
      this.initContract({ pairInfo: item });
    },
    checkActive(item) {
      return (
        item.trade_coin.toUpperCase() == this.tradeCoin &&
        item.margin_coin.toUpperCase() == this.marginCoin
      );
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>