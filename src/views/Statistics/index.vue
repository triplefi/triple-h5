<template>
    <div v-loading="loading" class="data-details">
        <el-button-group>
            <el-button
                @click="setPairCoin(e)"
                v-for="e in pairList"
                :key="e.trade_coin"
                :type="tradeCoinLower === e.trade_coin ? 'primary' : ''"
                >{{ e.trade_coin }}</el-button
            >
        </el-button-group>
        <div class="content">
            <div class="item">
                <div class="label">总多仓数量</div>
                <div class="value">{{ totalInfo.longAmount || '0' }}</div>
            </div>
            <div class="item">
                <div class="label">总空仓数量</div>
                <div class="value">{{ totalInfo.shortAmount || '0' }}</div>
            </div>
            <div class="item">
                <div class="label">总仓持仓人数</div>
                <div class="value">{{ totalInfo.totalNum || '0' }}</div>
            </div>
            <div class="item">
                <div class="label">多仓持仓人数</div>
                <div class="value">{{ totalInfo.longNum || '0' }}</div>
            </div>
            <div class="item">
                <div class="label">空仓持仓人数</div>
                <div class="value">{{ totalInfo.shortNum || '0' }}</div>
            </div>
            <el-table :data="posTableData" style="width: 100%">
                <el-table-column prop="address" label="用户地址"> </el-table-column>
                <el-table-column prop="direction" label="开仓方向"> </el-table-column>
                <el-table-column prop="amount" label="开仓数量"> </el-table-column>
                <el-table-column prop="price" label="开仓价格"> </el-table-column>
                <el-table-column prop="unrealizedPL" label="unrealized P/L"> </el-table-column>
            </el-table>
            <el-pagination
                background
                :currentPage.sync="posPage"
                :pageSize="pageSize"
                v-if="posAddressList.length"
                layout="prev, pager, next"
                :total="posAddressList.length"
            >
            </el-pagination>
            <div style="height: 60px"></div>
            <!-- <div class="item">用户交易历史记录</div>
            <el-table :data="showTradeList" style="width: 100%">
                <el-table-column prop="time" label="交易时间"> </el-table-column>
                <el-table-column prop="direction" label="开仓方向">
                    <template slot-scope="scope">
                        {{ scope.row.direction == 1 ? '多' : '空' }}
                    </template>
                </el-table-column>
                <el-table-column prop="amount" label="开仓数量">
                    <template slot-scope="scope">
                        {{ amountPrecision(scope.row.amount) }}
                    </template>
                </el-table-column>
                <el-table-column prop="price" label="开仓价格">
                    <template slot-scope="scope">
                        {{ formatDecimals(scope.row.price) | formatMoney }}
                    </template>
                </el-table-column>
            </el-table>
            <el-pagination
                background
                :currentPage.sync="tradePage"
                :pageSize="tradePageSize"
                v-if="tradeList.length"
                layout="prev, pager, next"
                :total="tradeList.length"
            >
            </el-pagination> -->
        </div>
    </div>
</template>

<script>
import { getAllAccount, getAccountInterest, getAccountTrade } from '@/api'
import { mapState, mapActions } from 'vuex'
import { formatMoney } from '@/utils/util'
import dayjs from 'dayjs'
export default {
    data() {
        return {
            loading: false,
            addressList: [],
            posTableData: [],
            pageSize: 10,
            posPage: 1,
            totalInfo: {},
            // interestTableData:[],
            // interestPage: 1,

            tradePageSize: 10,
            tradePage: 1,
            tradeList: []
        }
    },
    watch: {
        contract: {
            immediate: true,
            handler(v) {
                if (v) {
                    this.getData()
                }
            }
        },
        posPage() {
            this.getAddressDetail()
        }
    },
    computed: {
        ...mapState(['pairInfo', 'pairList']),
        posAddressList() {
            return this.addressList.filter((e) => e.Lposition || e.Sposition)
        },
        tradeCoinLower() {
            return (this.tradeCoin || '').toLocaleLowerCase()
        },
        showTradeList() {
            return this.tradeList.slice((this.tradePage - 1) * this.tradePageSize, this.tradePage * this.tradePageSize)
        }
    },
    methods: {
        ...mapActions(['setPairCoin']),
        async getAllAccount(contract) {
            const res = await getAllAccount(contract)
            this.addressList = res.data
            this.getAddressDetail()
        },
        formatNum(v) {
            return formatMoney(this.amountPrecision(v * 1))
        },
        async getAddressDetail() {
            const startIndex = (this.posPage - 1) * this.pageSize
            const curList = this.posAddressList.slice(startIndex, startIndex + this.pageSize)
            const res = await Promise.all(
                curList.map((e) => {
                    return this.contract.methods.traders(e.Account).call()
                })
            )
            const tableData = []
            res.forEach((e, i) => {
                let { longAmount, longPrice, shortAmount, shortPrice } = e
                longAmount = longAmount * 1
                shortAmount = shortAmount * 1
                if (longAmount > 0) {
                    const obj = {
                        address: curList[i].Account,
                        direction: '多',
                        amount: this.formatNum(longAmount),
                        unrealizedPL: formatMoney(this.formatDecimals(longAmount * (this.price - longPrice))),
                        price: formatMoney(this.pricePrecision(longPrice))
                    }
                    tableData.push(obj)
                }
                if (shortAmount > 0) {
                    const obj = {
                        address: curList[i].Account,
                        direction: '空',
                        amount: this.formatNum(shortAmount),
                        unrealizedPL: formatMoney(this.formatDecimals(shortAmount * (shortPrice - this.price))),
                        price: formatMoney(this.pricePrecision(shortPrice))
                    }
                    tableData.push(obj)
                }
            })
            this.posTableData = tableData
        },
        async getAccountInterest(contract) {
            const res = await Promise.all(
                this.addressList.map((e) => {
                    return getAccountInterest({
                        contract,
                        account: e.Account,
                        count: 10
                    })
                })
            )
            const dic = {}
            res.forEach(({ data }) => {
                data.forEach(async (d) => {
                    const { amount, block, direction, price } = d
                    const { timestamp } = await this.web3.eth.getBlock(block)
                    const date = dayjs(timestamp * 1000).format('YYYY-MM-DD')
                    dic[date] = dic[date] || {
                        date,
                        longAmount: 0,
                        shortAmount: 0
                    }
                    if (direction > 0) {
                        dic[date].longAmount += amount
                    } else {
                        dic[date].shortAmount += amount
                    }
                })
            })
        },
        async getAccountTrade(contract) {
            const res = await getAccountTrade({
                contract,
                count: 200,
                account: this.coinbase
            })
            if (res.result) {
                let list = []
                res.data.forEach(async (d) => {
                    const { amount, block, direction, price } = d
                    const { timestamp } = await this.web3.eth.getBlock(block)
                    const time = dayjs(timestamp * 1000).format('YYYY-MM-DD HH:mm')
                    list.push({
                        amount,
                        time,
                        direction,
                        price
                    })
                })
                this.tradeList = list
            }
        },
        async getData() {
            this.loading = false
            await this.getAllAccount(this.pairInfo.contract)
            const totalRes = await this.contract.methods.getPoolPosition().call()
            this.totalInfo = {
                longAmount: this.formatNum(totalRes[1]),
                shortAmount: this.formatNum(totalRes[3]),
                longNum: this.addressList.filter((e) => !!e.Lposition).length,
                shortNum: this.addressList.filter((e) => !!e.Sposition).length,
                totalNum: this.posAddressList.length
            }
            // this.getAccountInterest(this.pairInfo.contract)
            // this.getAccountTrade(this.pairInfo.contract)
        }
    }
}
</script>

<style lang="scss" scoped>
.data-details {
    background-color: var(--COLOR-bg1);
    min-height: calc(100vh - 40px);
    .content {
        padding: 60px;
        .item {
            font-size: 20px;
            margin-bottom: 10px;
            display: flex;
            .label {
                width: 200px;
            }
        }
    }
    .explosive-con {
        padding: 20px 60px;
        div {
            margin-bottom: 10px;
        }
        .el-input {
            width: 300px;
            margin-right: 30px;
        }
    }
}
</style>
