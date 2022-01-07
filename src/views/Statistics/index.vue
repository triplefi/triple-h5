<template>
    <div v-loading="loading" class="data-details">
        <el-button-group>
            <el-button
                @click="activeTab = e.trade_coin"
                v-for="e in pairs"
                :key="e.trade_coin"
                :type="activeTab === e.trade_coin ? 'primary' : ''"
                >{{ e.trade_coin }}</el-button
            >
        </el-button-group>
        <div class="content">
            <div class="item">
                <div class="label">总多仓数量</div>
                <div class="value">{{ totalInfo.longAmount || '' }}</div>
            </div>
            <div class="item">
                <div class="label">总空仓数量</div>
                <div class="value">{{ totalInfo.shortAmount || '' }}</div>
            </div>
            <div class="item">
                <div class="label">总仓持仓人数</div>
                <div class="value">{{ totalInfo.totalNum || '' }}</div>
            </div>
            <div class="item">
                <div class="label">多仓持仓人数</div>
                <div class="value">{{ totalInfo.longNum || '' }}</div>
            </div>
            <div class="item">
                <div class="label">空仓持仓人数</div>
                <div class="value">{{ totalInfo.shortNum || '' }}</div>
            </div>
            <el-table :data="tableData" style="width: 100%">
                <el-table-column prop="address" label="用户地址"> </el-table-column>
                <el-table-column prop="longAmount" label="多仓数量"> </el-table-column>
                <el-table-column prop="shortAmount" label="空仓数量"> </el-table-column>
                <el-table-column prop="unrealizedPL" label="unrealized P/L"> </el-table-column>
            </el-table>
            <el-pagination
                :currentPage.sync="currentPage"
                :pageSize="pageSize"
                v-if="addressList.length"
                layout="prev, pager, next"
                :total="addressList.length"
            >
            </el-pagination>
        </div>
    </div>
</template>

<script>
import { getTradePairs } from '@/api'
import { mapState, mapActions } from 'vuex'
import { getAllAccount } from '@/api'
import { formatMoney } from '@/utils/util'
export default {
    data() {
        return {
            pairs: [],
            activeTab: '',
            loading: false,
            addressList: [],
            tableData: [],
            pageSize: 10,
            currentPage: 1,
            totalInfo: {}
        }
    },
    mounted() {
        this._initWeb3 = !!this.web3
        this.getPairs()
    },
    beforeDestroy() {},
    watch: {
        activeTab(val) {
            const item = this.pairs.find((e) => e.trade_coin === val)
            if (item) {
                this.selectPair(item)
            }
        },
        web3(val) {
            if (val && !this._initWeb3) {
                this._initWeb3 = true
                this.getData()
            }
        },
        currentPage(v) {
            this.getAddressDetail()
        }
    },
    computed: {
        ...mapState(['pairInfo'])
    },
    methods: {
        ...mapActions(['initContract']),
        async getAllAccount(contract) {
            const res = await getAllAccount(contract)
            this.addressList = res.data.filter((e) => e.Lposition || e.Sposition)
            this.getAddressDetail()
        },
        formatNum(v) {
            return formatMoney(this.amountPrecision(v * 1))
        },
        async getAddressDetail() {
            const startIndex = (this.currentPage - 1) * this.pageSize
            const curList = this.addressList.slice(startIndex, startIndex + this.pageSize)
            console.log(curList)
            const res = await Promise.all(
                curList.map((e) => {
                    return this.contract.methods.traders(e.Account).call()
                })
            )
            this.tableData = res.map((e, i) => {
                const { longAmount, longPrice, shortAmount, shortPrice } = e

                const longUpl = longAmount * (this.price - longPrice)
                const shortUpl = shortAmount * (shortPrice - this.price)
                const unrealizedPL = longUpl + shortUpl
                return {
                    address: curList[i].Account,
                    longAmount: this.formatNum(longAmount),
                    shortAmount: this.formatNum(shortAmount),
                    unrealizedPL: formatMoney(this.formatDecimals(unrealizedPL))
                }
            })
        },
        async getPairs() {
            this.loading = true
            try {
                const res = await getTradePairs()
                if (res.result) {
                    this.pairs = res.data
                    this.activeTab = this.pairs[0].trade_coin
                }
            } catch (error) {
                console.log(error)
                this.getPairs()
            }
        },
        async selectPair(item) {
            this.loading = true
            this.$store.commit('setContractAddress', item.contract)
            this.$store.commit('setPairInfo', item)
            this._isInitPairInfo = true
            this.getData()
        },
        async getData() {
            if (this._isInitPairInfo && this._initWeb3) {
                await this.initContract({ pairInfo: this.pairInfo })
                this.loading = false
                await this.getAllAccount(this.pairInfo.contract)
                const totalRes = await this.contract.methods.getPoolPosition().call()
                console.log(totalRes)
                this.totalInfo = {
                    longAmount: this.formatNum(totalRes[1]),
                    shortAmount: this.formatNum(totalRes[3]),
                    longNum: this.addressList.filter((e) => e.Lposition).length,
                    shortNum: this.addressList.filter((e) => e.Sposition).length,
                    totalNum: this.addressList.length
                }
            }
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
