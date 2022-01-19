<template>
    <div class="tarde-order">
        <el-table class="a-table" :data="tradeList" empty-text="No Data">
            <el-table-column prop="time" label="Time"> </el-table-column>
            <el-table-column prop="direction" label="Direction">
                <template slot-scope="scope">
                    {{ getDirection(scope.row.direction) }}
                </template>
            </el-table-column>
            <el-table-column prop="amount" label="Amount">
                <template slot-scope="scope">
                    {{ amountPrecision(scope.row.amount) }}
                </template>
            </el-table-column>
            <el-table-column prop="price" label="Price">
                <template slot-scope="scope">
                    {{ pricePrecision(scope.row.price) | formatMoney }}
                </template>
            </el-table-column>
            <el-table-column prop="fee" label="Fee">
                <template slot-scope="scope">
                    {{ pricePrecision(scope.row.fee) | formatMoney }}
                </template>
            </el-table-column>
        </el-table>
        <el-pagination
            class="a-pagination"
            hide-on-single-page
            :currentPage.sync="page"
            :pageSize="pageSize"
            layout="prev, pager, next"
            :total="list.length"
        >
        </el-pagination>
    </div>
</template>

<script>
import Big from 'big.js'
import dayjs from 'dayjs'
import { getAccountTrade } from '@/api'
import { mapState } from 'vuex'
export default {
    name: 'His',
    data() {
        return {
            page: 1,
            pageSize: 10,
            list: []
        }
    },
    computed: {
        ...mapState(['pairInfo', 'feeRate', 'divConst', 'amountDecimal']),
        tradeList() {
            return this.list.slice((this.page - 1) * this.pageSize, this.page * this.pageSize)
        }
    },
    watch: {
        contract: {
            immediate: true,
            handler(v) {
                if (v) {
                    this.getAccountTrade()
                }
            }
        },
        pairInfo: {
            immediate: true,
            handler(v) {
                if (v) {
                    this.getAccountTrade()
                }
            }
        }
    },
    methods: {
        getDirection(k) {
            return {
                1: 'Open Long',
                '-1': 'Open Short',
                2: 'Close Short',
                '-2': 'Close Long'
            }[k]
        },
        async getAccountTrade() {
            if (!this.pairInfo || !this.contract) {
                return
            }
            const res = await getAccountTrade({
                contract: this.pairInfo.contract,
                count: 200,
                account: this.coinbase
            })
            if (res.result) {
                let list = []
                res.data.forEach(async (d) => {
                    const { amount, block, direction, price } = d
                    const { timestamp } = await this.web3.eth.getBlock(block)
                    const time = dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm')
                    console.log(amount, Math.pow(10, this.amountDecimal), '---', this.feeRate, this.divConst, price)
                    list.push({
                        amount,
                        time,
                        direction,
                        price,
                        fee: String(
                            Big(amount)
                                .times(Math.pow(10, this.amountDecimal))
                                .times(price)
                                .times(this.feeRate || 0)
                                .div(this.divConst || 1)
                        )
                    })
                })
                this.list = list
            }
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
