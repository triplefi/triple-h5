<template>
    <div class="order">
        <div class="fs14b title">Position</div>
        <el-table class="a-table" :data="list" empty-text="No Data">
            <el-table-column label="Pair" prop="pair"></el-table-column>
            <el-table-column label="Direction" prop="direction" :formatter="directionFormatter"></el-table-column>
            <el-table-column label="Open Price" prop="openPrice">
                <template slot-scope="scope">
                    {{ pricePrecision(scope.row.openPrice) | formatMoney }}
                </template>
            </el-table-column>
            <el-table-column label="Amount" prop="amount">
                <template slot-scope="scope">
                    {{ amountPrecision(scope.row.amount) | formatMoney }}
                </template>
            </el-table-column>
            <el-table-column label="Unrealized P/L">
                <template slot-scope="scope">
                    {{ formatDecimals(getUnrealizedPL(scope.row)) | formatMoney }}
                </template>
            </el-table-column>
            <el-table-column label="Est. Close Price">
                <template slot-scope="scope">
                    {{ pricePrecision(scope.row.direction > 0 ? slidePriceShort : slidePriceLong) | formatMoney }}
                </template>
            </el-table-column>
            <el-table-column width="340px">
                <template slot-scope="scope">
                    <div class="flex flex-ac">
                        <el-input-number
                            size="small"
                            style="width: 127px"
                            v-model="scope.row.closeNum"
                            :precision="precision"
                            :step="step"
                            :min="0"
                            :max="amountPrecision(scope.row.maxNum) * 1"
                            placeholder="Amount"
                        ></el-input-number>
                        <div class="fs12 all" @click="handleAll(scope.row)">Max</div>
                        <el-button class="btn-close" type="primary" size="small" round @click="handleClose(scope.row)"
                            >Close</el-button
                        >
                    </div>
                </template>
            </el-table-column>
        </el-table>
    </div>
</template>

<script>
import Big from 'big.js'
import { mapState, mapActions, mapGetters } from 'vuex'
export default {
    name: 'Order',
    data() {
        return {
            margin: 0,
            list: [
                // {
                //   pair: "ETH/USDT",
                //   direction: 1,
                //   openPrice: "437.19",
                //   amount: 10000,
                //   unrealizedPL: "142999",
                //   closeNum: ""
                // }
            ]
        }
    },
    computed: {
        ...mapState(['position', 'tolerance', 'poolNet']),
        ...mapGetters(['symbol', 'slidePrice', 'CloseMaxAmount']),
        slidePriceLong() {
            //多仓偏移价格
            return this.price + (this.slidePrice[1] || 0)
        },
        slidePriceShort() {
            //空仓偏移价格
            return this.price - (this.slidePrice[0] || 0)
        },
        precision() {
            return Math.abs(this.amountDecimal)
        },
        step() {
            return Math.pow(10, this.amountDecimal)
        }
    },
    watch: {
        position: {
            handler(n) {
                this.setPosition(n)
            },
            immediate: true,
            deep: true
        },
        CloseMaxAmount() {
            this.setPosition(this.position)
        }
    },
    methods: {
        ...mapActions(['closeLong', 'closeShort']),
        deadlineTimestamp() {
            return parseInt(new Date().getTime() / 1000) + this.deadline
        },
        async setPosition(val) {
            this.list = []
            const { longAmount, longPrice, margin, shortAmount, shortPrice } = val
            const limit = this.CloseMaxAmount
            this.margin = margin
            if (longAmount * 1) {
                const maxNum = Math.min(longAmount * 1, limit)
                this.list.push({
                    pair: this.symbol,
                    direction: 1,
                    openPrice: longPrice * 1,
                    amount: longAmount * 1,
                    unrealizedPL: '',
                    closeNum: '',
                    maxNum
                })
            }
            if (shortAmount * 1) {
                const maxNum = Math.min(shortAmount * 1, limit)
                this.list.push({
                    pair: this.symbol,
                    direction: -1,
                    openPrice: shortPrice * 1,
                    amount: shortAmount * 1,
                    unrealizedPL: '',
                    closeNum: '',
                    maxNum
                })
            }
        },
        handleAll(row) {
            row.closeNum = row.maxNum
        },
        directionFormatter(row) {
            return row.direction > 0 ? 'LONG' : 'SHORT'
        },
        getUnrealizedPL(row) {
            if (row.direction > 0) {
                return row.amount * (this.price - row.openPrice)
            } else {
                return row.amount * (row.openPrice - this.price)
            }
        },
        handleClose(row) {
            if (parseFloat(row.closeNum) == 0) {
                this.$message({
                    type: 'error',
                    message: 'Please enter the amount.'
                })
                return
            }
            const params = {
                direction: row.direction,
                amount: this.toBN(Big(row.closeNum).div(this.step)),
                // amount: this.toBN(row.closeNum / this.step),
                deadline: this.deadlineTimestamp()
            }
            const price = row.direction > 0 ? this.slidePriceShort : this.slidePriceLong
            const toleranceExp = Big(this.tolerance).div(100)
            if (row.direction > 0) {
                const priceExp = this.toBN(Math.floor(Big(1).minus(toleranceExp).times(price)))
                //  const priceExp = this.toBN(Math.floor((1 - this.tolerance / 100) * price))
                params.priceExp = priceExp
                console.log(params)
                this.closeLong(params)
                    .then((res) => {
                        console.log(res)
                        this.refreshData()
                    })
                    .catch((err) => {
                        console.error(err)
                    })
            } else if (row.direction < 0) {
                const priceExp = this.toBN(Math.floor(Big(1).plus(toleranceExp).times(price)))
                // const priceExp = this.toBN(Math.floor((1 + this.tolerance / 100) * price))
                params.priceExp = priceExp
                console.log(params)
                this.closeShort(params)
                    .then((res) => {
                        console.log(res)
                        this.refreshData()
                    })
                    .catch((err) => {
                        console.error(err)
                    })
            }
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
