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
            <el-table-column label="Close Price">
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
                            :max="amountPrecision(scope.row.amount) * 1"
                            placeholder="Amount"
                        ></el-input-number>
                        <div class="fs12 all" @click="handleAll(scope.row)">All</div>
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
        ...mapGetters(['symbol', 'slidePrice']),
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
            this.margin = margin
            if (longAmount * 1) {
                this.list.push({
                    pair: this.symbol,
                    direction: 1,
                    openPrice: longPrice * 1,
                    amount: longAmount * 1,
                    unrealizedPL: '',
                    closeNum: ''
                })
            }
            if (shortAmount * 1) {
                this.list.push({
                    pair: this.symbol,
                    direction: -1,
                    openPrice: shortPrice * 1,
                    amount: shortAmount * 1,
                    unrealizedPL: '',
                    closeNum: ''
                })
            }
        },
        handleAll(row) {
            row.closeNum = row.amount
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
            const params = {
                direction: row.direction,
                amount: this.toBN(row.closeNum / this.step),
                deadline: this.deadlineTimestamp()
            }
            const price = row.direction > 0 ? this.slidePriceShort : this.slidePriceLong
            if (row.direction > 0) {
                const priceExp = this.toBN(Math.floor((1 - this.tolerance / 100) * price))
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
                const priceExp = this.toBN(Math.floor((1 + this.tolerance / 100) * price))
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
