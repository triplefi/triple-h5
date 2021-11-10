<template>
  <div class="account">
    <div class="flex flex-ac">
      <div class="fs12 name">Wallet</div>
      <div class="fs12 value">
        {{ formatDecimals(token0Balance) | formatMoney }}
      </div>
      <div class="fs12 transfer" @click="transfer">Transfer</div>
    </div>
    <div class="flex flex-ac">
      <div class="fs12 name">Margin</div>
      <div class="fs12 value">
        {{ formatDecimals(position.margin) | formatMoney }}
      </div>
    </div>
    <!-- <div class="flex flex-ac">
      <div class="fs12 name">Used Margin</div>
      <div class="fs12 value">
        {{ formatDecimals(UsedMargin) | formatMoney }}
      </div>
    </div>
    <div class="flex flex-ac">
      <div class="fs12 name">Can Use Margin</div>
      <div class="fs12 value">
        {{ formatDecimals(canUseMargin) | formatMoney }}
      </div>
    </div> -->
    <div class="flex flex-ac">
      <div class="fs12 name">Net Value</div>
      <div class="fs12 value">{{ formatDecimals(NetValue) | formatMoney }}</div>
    </div>
    <div class="flex flex-ac">
      <div class="fs12 name">Liquidation Price</div>
      <div class="fs12 value">
        {{ pricePrecision(LiquidationPrice) | formatMoney }}
      </div>
    </div>

    <el-dialog
      title="Margin Transfer"
      :visible.sync="showTab"
      :close-on-click-modal="false"
      width="375px"
    >
      <div class="content-tab">
        <el-tabs v-model="activeName" type="card">
          <el-tab-pane label="Recharge" name="recharge">
            <el-input-number
              style="width: 100%; margin-top: 20px"
              v-model="amount1"
              :precision="precision"
              :step="step"
              :min="0"
              :max="maxRecharge"
            ></el-input-number>
            <div class="flex available">
              <div class="flex-1 fs14">Available {{ maxRecharge }}</div>
              <div class="fs14b max" @click="handleMax()">Max</div>
            </div>
            <el-button
              style="width: 100%"
              type="primary"
              round
              @click="handleRechargeMargin"
              >Confirm</el-button
            >
          </el-tab-pane>
          <el-tab-pane label="Withdraw" name="withdraw">
            <el-input-number
              style="width: 100%; margin-top: 20px"
              v-model="amount2"
              :precision="precision"
              :step="step"
              :min="0"
              :max="maxWithdraw"
            ></el-input-number>
            <div class="flex available">
              <div class="flex-1 fs14">Available {{ maxWithdraw }}</div>
              <div class="fs14b max" @click="handleMax()">Max</div>
            </div>
            <el-button
              style="width: 100%"
              type="primary"
              round
              @click="handleWithdrawMargin"
              >Confirm</el-button
            >
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from "vuex";
export default {
  name: "Account",
  data() {
    return {
      showTab: false,
      amount1: 0,
      amount2: 0,

      activeName: "recharge",
    };
  },
  computed: {
    ...mapState(["token0Balance", "position"]),
    ...mapGetters([
      "UsedMargin",
      "NetValue",
      "canUseMargin",
      "LiquidationPrice",
    ]),
    precision() {
      return Math.abs(this.decimals) || 2;
    },
    step() {
      return 1 / Math.pow(10, this.decimals) || 0.01;
    },
    maxRecharge() {
      return Number(this.formatDecimals(this.token0Balance));
    },
    maxWithdraw() {
      if (this.NetValue - this.UsedMargin < 0) {
        return 0;
      } else {
        return Number(this.formatDecimals(this.NetValue - this.UsedMargin));
      }
    },
  },
  methods: {
    ...mapActions(["rechargeMargin", "withdrawMargin"]),
    transfer() {
      this.showTab = true;
    },
    handleMax() {
      if (this.activeName === "recharge") {
        this.amount1 = this.maxRecharge;
      } else {
        this.amount2 = this.maxWithdraw;
      }
    },
    async handleRechargeMargin() {
      const params = {
        amount: this.toBN(this.amount1 * Math.pow(10, this.decimals)),
      };
      console.log(params);
      this.showTab = false;
      this.rechargeMargin(params)
        .then((res) => {
          console.log(res);
          this.amount1 = 0;
          this.refreshData();
        })
        .catch((err) => {
          console.error(err);
        });
    },
    async handleWithdrawMargin() {
      const params = {
        amount: this.toBN(this.amount2 * Math.pow(10, this.decimals)),
      };
      console.log(params);
      this.showTab = false;
      this.withdrawMargin(params)
        .then((res) => {
          console.log(res);
          this.amount2 = 0;
          this.refreshData();
        })
        .catch((err) => {
          console.error(err);
        });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>