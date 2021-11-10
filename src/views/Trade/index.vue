<template>
  <div class="page trade">
    <Market></Market>
    <div class="flex-1">
      <div class="flex mis">
        <div class="flex-1 mid">
          <Current></Current>
          <!-- <div class="kline">
            <img src="./kline.png" width="100%" height="100%" alt="" />
          </div> -->
          <Kline></Kline>
          <Action></Action>
        </div>
        <div class="right">
          <Deal></Deal>
          <Account></Account>
        </div>
      </div>
      <Order></Order>
      <div style="height: 32px"></div>
    </div>
  </div>
</template>

<script>
import Market from "./components/Market";
import Current from "./components/Current";
import Action from "./components/Action";
import Deal from "./components/Deal";
import Account from "./components/Account";
import Order from "./components/Order";
import Kline from "./components/Kline";
export default {
  name: "Trade",
  components: {
    Market,
    Current,
    Action,
    Deal,
    Account,
    Order,
    Kline
  }
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>