<template>
    <div class="action-con">
        <div class="leverage-commission">
            <div class="label">Leverage:</div>
            <div class="value">{{ leverage }}x</div>
            <div class="label">Commission:</div>
            <div class="value">{{ r | formatNum(3) }}%</div>
        </div>
        <div class="flex action">
            <div class="flex-1 action-item long">
                <div class="flex flex-ac">
                    <div class="label btn13">Buy Price</div>
                    <h5 class="price">{{ pricePrecision(slidePriceLong) | formatMoney }}</h5>
                </div>
                <div style="height: 24px">
                    <!-- Max Amount: {{amountPrecision(LongMaxAmount)}} -->
                </div>
                <div class="flex flex-ac">
                    <div class="label btn13">Amount</div>
                    <el-input-number
                        style="width: 100%"
                        v-model="amount1show"
                        :precision="precision"
                        :step="step"
                        :min="0"
                        :max="amountPrecision(LongMaxAmount) * 1"
                    ></el-input-number>
                </div>
                <div class="flex">
                    <div class="label"></div>
                    <div class="flex-1">
                        <div class="flex precent">
                            <div
                                v-for="item in precents"
                                :key="item"
                                class="fs14"
                                @click="handlePrecent1(item)"
                                :class="{ active: precent1 === item }"
                            >
                                {{ item }}%
                            </div>
                        </div>
                        <el-button style="width: 100%" type="info" round @click="handleOpenLong"
                            ><span style="font-weight: bold">LONG</span></el-button
                        >
                    </div>
                </div>
            </div>
            <div class="line"></div>
            <div class="flex-1 action-item short">
                <div class="flex flex-ac">
                    <div class="label btn13">Sell Price</div>
                    <h5 class="price">{{ pricePrecision(slidePriceShort) | formatMoney }}</h5>
                </div>
                <div style="height: 24px">
                    <!-- Max Amount: {{amountPrecision(ShortMaxAmount)}} -->
                </div>
                <div class="flex flex-ac">
                    <div class="label btn13">Amount</div>
                    <el-input-number
                        style="width: 100%"
                        v-model="amount2show"
                        :precision="precision"
                        :step="step"
                        :min="0"
                        :max="amountPrecision(ShortMaxAmount) * 1"
                    ></el-input-number>
                </div>
                <div class="flex">
                    <div class="label"></div>
                    <div class="flex-1">
                        <div class="flex precent">
                            <div
                                v-for="item in precents"
                                :key="item"
                                class="fs14"
                                @click="handlePrecent2(item)"
                                :class="{ active: precent2 === item }"
                            >
                                {{ item }}%
                            </div>
                        </div>
                        <el-button style="width: 100%" type="danger" round @click="handleOpenShort"
                            ><span style="font-weight: bold">SHORT</span></el-button
                        >
                    </div>
                </div>
            </div>

            <div class="set" @click="set">
                <svg-icon icon-class="ic_Setting" class-name="s24 icon"></svg-icon>
            </div>
            <div class="flex flex-ac warn-tip" v-if="showTip">
                <svg-icon icon-class="ic_16note" class-name="icon-tip"></svg-icon>
                <span class="fs12">Information to note</span>
            </div>
            <div class="approve-mask" v-if="!allowance">
                <el-button type="primary" round @click="handleApprove" :disabled="!coinbase">
                    <span style="font-weight: bold">Authorize</span>
                </el-button>
            </div>

            <el-dialog title="Transaction Settings" :visible.sync="model" :show-header="false" width="375px">
                <div class="content">
                    <div class="flex flex-ac">
                        <span class="fs14 label">Slippage tolerance</span>
                        <el-tooltip
                            effect="dark"
                            content="Text Demo - Your transaction will revert if the price changes unfavorably by more than this percentage."
                            placement="top"
                        >
                            <svg-icon icon-class="ic_16qs" class-name="s16 icon-question"></svg-icon>
                        </el-tooltip>
                    </div>
                    <div class="flex precent">
                        <div
                            v-for="item in tolerances"
                            :key="item"
                            class="fs14"
                            @click="changeTolerance(item)"
                            :class="{ active: tolerance === item }"
                        >
                            {{ item }}%
                        </div>
                    </div>
                    <div class="flex flex-ac">
                        <span class="fs14 label">Transaction deadline</span>
                        <el-tooltip
                            effect="dark"
                            content="Text Demo - Your transaction will revert if the price changes unfavorably by more than this percentage."
                            placement="top"
                        >
                            <svg-icon icon-class="ic_16qs" class-name="s16 icon-question"></svg-icon>
                        </el-tooltip>
                    </div>
                    <div style="height: 16px"></div>
                    <div class="flex flex-ac">
                        <el-input-number
                            class="min-input"
                            :value="deadlineMinute"
                            :step="1"
                            :precision="0"
                            :min="1"
                            :max="60"
                            @change="changeDeadline"
                        ></el-input-number>
                        <span class="min">Minute</span>
                    </div>
                    <!-- <div style="height: 24px"></div>
        <div class="flex flex-bt">
          <div class="fs14 label">Switch style</div>
          <el-switch
            inactive-color="#2E2C3D"
            :width="51"
            v-model="st"
          ></el-switch>
        </div>
        <div style="height: 28px"></div>
        <div class="flex flex-bt">
          <span class="fs14 label">Minimum received </span>
          <span class="fs14 value">0 MARK</span>
        </div>
        <div style="height: 10px"></div>
        <div class="flex flex-bt">
          <span class="fs14 label">Price Impact</span>
          <span class="fs14 value">0.00%</span>
        </div> -->
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import SvgIcon from '../../../../icons/SvgIcon.vue'
import { mapState, mapGetters, mapActions } from 'vuex'
export default {
    components: { SvgIcon },
    name: 'Action',
    data() {
        return {
            precents: [25, 50, 75, 100],
            precent1: 0,
            precent2: 0,
            // amount1: "",
            amount1show: '',
            // amount2: "",
            amount2show: '',

            tolerances: [0.1, 0.5, 1, 1.5],
            // tolerance: 0.5,
            // deadline: "",
            st: false,

            model: false,
            showTip: false
        }
    },
    computed: {
        ...mapState(['tolerance', 'allowance', 'leverage', 'feeRate', 'divConst', 'poolNetAmountRateLimitOpen']),
        ...mapGetters(['LongMaxAmount', 'ShortMaxAmount', 'canUseMargin', 'slidePrice', 'R']),
        r() {
            return (this.feeRate / this.divConst) * 100
        },
        slidePriceLong() {
            //多仓偏移价格
            return this.price + (this.slidePrice[1] || 0)
        },
        slidePriceShort() {
            //空仓偏移价格
            return this.price - (this.slidePrice[0] || 0)
        },
        deadlineMinute() {
            return this.deadline / 60
        },
        precision() {
            return Math.abs(this.amountDecimal)
        },
        step() {
            return Math.pow(10, this.amountDecimal)
        },
        amount1() {
            return Math.floor(this.amount1show / this.step)
        },
        amount2() {
            return Math.floor(this.amount2show / this.step)
        },
        // 8.开仓时需要转入合约的保证金数量rechargeAmount
        // 设本次开仓量为x张合约，则需要的保证金数为：
        // NeedMargin = (price(每张合约的当前价格) * (1± slideP / divConst) (开多仓为 +, 开空仓为 -)) * amount（开仓量）)* (r(同5) + 1 / leverage)
        // 用户现有可用保证金按照5中的canUseMargin 来计算。
        // 如果 NeedMargin <= canUseMargin，则rechargeAmount = 0；
        // 否则，rechargeAmount = NeedMargin - canUseMargin；
        LongRechargeAmount() {
            const { price, leverage, feeRate, divConst, slideP } = this.$store.state
            const openPrice = price * (1 + slideP / divConst)
            const openMargin = Math.floor((openPrice * this.amount1 * feeRate) / divConst) // 所需保证金
            const fee = Math.floor((openPrice * this.amount1) / leverage) // 所需手续费
            const NeedMargin = openMargin + fee
            if (NeedMargin <= this.canUseMargin) {
                return 0
            } else {
                return NeedMargin - this.canUseMargin
            }
        },
        ShortRechargeAmount() {
            const { price, leverage, feeRate, divConst, slideP } = this.$store.state
            const openPrice = price * (1 - slideP / divConst)
            const openMargin = Math.floor((openPrice * this.amount2 * feeRate) / divConst) // 所需保证金
            const fee = Math.floor((openPrice * this.amount2) / leverage) // 所需手续费
            const NeedMargin = openMargin + fee
            if (NeedMargin <= this.canUseMargin) {
                return 0
            } else {
                return NeedMargin - this.canUseMargin
            }
        }
    },
    methods: {
        ...mapActions(['openLong', 'openShort']),
        deadlineTimestamp() {
            return parseInt(new Date().getTime() / 1000) + this.deadline
        },
        set() {
            this.model = true
        },
        handlePrecent1(val) {
            this.precent1 = val
            this.amount1show = ((this.LongMaxAmount * val) / 100) * this.step
        },
        handlePrecent2(val) {
            this.precent2 = val
            this.amount2show = ((this.ShortMaxAmount * val) / 100) * this.step
        },
        // 用户开多
        async handleOpenLong() {
            if (!this.coinbase) {
                this.$message({
                    type: 'error',
                    message: 'Please connect wallet first.'
                })
                return
            }
            if (!this.allowance) {
                return this.handleApprove()
            }
            if (this.R <= -this.poolNetAmountRateLimitOpen) {
                return this.$message({
                    type: 'error',
                    message: 'Total long position exceeds the limit. Please try again later.'
                })
            }
            const params = {
                priceExp: this.toBN(Math.floor((1 + this.tolerance / 100) * this.slidePriceLong)),
                amount: this.toBN(this.amount1),
                deadline: this.deadlineTimestamp()
                // rechargeAmount: this.toBN(this.LongRechargeAmount)
            }
            console.log(params)
            this.openLong(params)
                .then((res) => {
                    console.log(res)
                    this.refreshData()
                })
                .catch((err) => {
                    console.error(err)
                })
        },
        // 用户开空
        handleOpenShort() {
            if (!this.coinbase) {
                this.$message({
                    type: 'error',
                    message: 'Please connect wallet first.'
                })
                return
            }
            if (!this.allowance) {
                return this.handleApprove()
            }
            if (this.R >= this.poolNetAmountRateLimitOpen) {
                return this.$message({
                    type: 'error',
                    message: 'Total short position exceeds the limit. Please try again later.'
                })
            }
            const params = {
                priceExp: this.toBN(Math.floor((1 - this.tolerance / 100) * this.slidePriceShort)),
                amount: this.toBN(this.amount2),
                deadline: this.deadlineTimestamp()
                // rechargeAmount: this.toBN(this.ShortRechargeAmount)
            }
            console.log(params)
            this.openShort(params)
                .then((res) => {
                    console.log(res)
                    this.refreshData()
                })
                .catch((err) => {
                    console.error(err)
                })
        },
        changeDeadline(e) {
            this.$store.commit('setDeadline', e * 60)
        },
        changeTolerance(e) {
            this.$store.commit('setTolerance', e)
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
