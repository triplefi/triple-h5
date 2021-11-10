<template>
  <div class="deal">
    <div class="title">
      <span class="btn14">Times and Sales</span>
      <div class="line"></div>
    </div>
    <div class="list">
      <div class="list-item head">
        <div class="fs12 times">Times</div>
        <div class="fs12 price">Price</div>
        <div class="fs12 amount">Amount</div>
      </div>
      <div class="body">
        <div class="list-item" v-for="item in trades" :key="item.transactionHash">
          <div class="fs13 times">
            {{ item.time | formatDateTime("hh:mm:ss") }}
          </div>
          <div
            class="fs13 price"
            :class="[item.direction * 1 > 0 ? 'green' : 'red']"
          >
            {{ pricePrecision(item.price) | formatMoney }}
          </div>
          <div class="fs13 amount">{{ amountPrecision(item.amount) | formatMoney }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  name: "Deal",
  data() {
    return {};
  },
  computed: {
    ...mapState(["trades"])
  }
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>