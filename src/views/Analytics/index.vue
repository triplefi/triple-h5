<template>
    <div class="analyticss">
        <div class="left-con">
            <div
                class="pair-item"
                @click="setPairCoin(item)"
                :class="{ active: tradeCoinLower === item.trade_coin }"
                v-for="item in pairList"
                :key="item.trade_coin"
            >
                <img :src="item.trade_coin.toUpperCase() | getCoinIcon" alt="" />
                <span>{{ item.trade_coin.toUpperCase() }}</span>
            </div>
        </div>
        <div class="right-con">
            <div class="tab-con">
                <div
                    @click="curTab = item.id"
                    :class="`tab-item ${curTab === item.id ? 'active' : ''}`"
                    v-for="item in tabList"
                    :key="item.id"
                >
                    {{ item.label }}
                </div>
            </div>
            <div v-loading="loading" v-if="curTab == 1">
                <div class="content">
                    <div class="item">
                        <div class="label">lp pool net</div>
                        <div class="value">{{ formatDecimals(poolNet) | formatMoney }}</div>
                    </div>
                    <div class="item">
                        <div class="label">lp pool unrealized P/L</div>
                        <div class="value">{{ formatDecimals(unrealizedPL) }}</div>
                    </div>
                    <div class="item">
                        <div class="label">lp pool usdt</div>
                        <div class="value">{{ formatDecimals(totalPool) | formatMoney }}</div>
                    </div>
                    <div class="item">
                        <div class="label">long amount</div>
                        <div class="value">{{ amountPrecision(poolShortAmount) }}</div>
                    </div>
                    <div class="item">
                        <div class="label">short amount</div>
                        <div class="value">{{ amountPrecision(poolLongAmount) }}</div>
                    </div>
                    <div class="item">
                        <div class="label">R</div>
                        <div class="value">{{ R | formatNum(3) }}%</div>
                    </div>
                    <div class="item">
                        <div class="label">pool used margin</div>
                        <div class="value">{{ formatDecimals(usedMargin) | formatMoney }}</div>
                    </div>
                    <div class="item">
                        <div class="label">lp pool maintenance margin</div>
                        <div class="value">{{ formatDecimals(keepMargin) | formatMoney }}</div>
                    </div>
                </div>
            </div>
            <div v-loading="loading" v-else>
                <div class="total-con">
                    <div class="item">
                        <div class="label">Long Amount</div>
                        <div class="value">{{ totalInfo.longAmount || '0' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">Short Amount</div>
                        <div class="value">{{ totalInfo.shortAmount || '0' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">Total Accounts</div>
                        <div class="value">{{ totalInfo.totalNum || '0' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">Long Accounts</div>
                        <div class="value">{{ totalInfo.longNum || '0' }}</div>
                    </div>
                    <div class="item">
                        <div class="label">Short Accounts</div>
                        <div class="value">{{ totalInfo.shortNum || '0' }}</div>
                    </div>
                </div>
                <div class="table-con">
                    <el-table
                        class="a-table"
                        :style="`width:${tableWidth}px`"
                        :data="posTableData"
                        empty-text="No Data"
                    >
                        <el-table-column width="400" prop="address" label="User Address"> </el-table-column>
                        <el-table-column width="170" prop="direction" label="Direction"> </el-table-column>
                        <el-table-column width="170" prop="amount" label="Amount"> </el-table-column>
                        <el-table-column width="170" prop="price" label="Open Price"> </el-table-column>
                        <el-table-column align="right" prop="unrealizedPL" label="Unrealized P/L"></el-table-column>
                    </el-table>
                    <el-pagination
                        class="a-pagination"
                        background
                        :currentPage.sync="posPage"
                        :pageSize="pageSize"
                        hide-on-single-page
                        layout="prev, pager, next"
                        :total="posAddressList.length"
                    >
                    </el-pagination>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { getAllAccount } from '@/api'
import { formatMoney } from '@/utils/util'
import networkMixin from '@/components/networkMixin'
export default {
    mixins: [networkMixin],
    data() {
        return {
            loading: false,
            curTab: 1,
            tabList: [
                {
                    id: 1,
                    label: 'Overview'
                },
                {
                    id: 2,
                    label: 'User Position'
                }
            ],

            addressList: [],
            posTableData: [],
            pageSize: 10,
            posPage: 1,
            totalInfo: {},
            tableWidth: document.body.offsetWidth - 264
        }
    },
    beforeDestroy() {
        if (this.timeHandler) {
            clearInterval(this.timeHandler)
        }
    },
    computed: {
        ...mapState([
            'poolNet',
            'poolLongPrice',
            'poolShortPrice',
            'divConst',
            'poolLongAmount',
            'poolShortAmount',
            'totalPool',
            'pairInfo',
            'poolState',
            'pairList'
        ]),
        R() {
            const { poolLongAmount, poolShortAmount, poolNet, price } = this
            return (((poolShortAmount - poolLongAmount) * price) / poolNet) * 100
        },
        unrealizedPL() {
            if (this.poolState == 2) {
                return 0
            }
            const { poolLongAmount, poolLongPrice, poolShortAmount, poolShortPrice, price } = this
            const longUpl = poolLongAmount * (price - poolLongPrice)
            const shortUpl = poolShortAmount * (poolShortPrice - price)
            return longUpl + shortUpl
        },
        usedMargin() {
            const { poolLongAmount, poolShortAmount, price } = this
            let netAmount = Math.abs(poolLongAmount - poolShortAmount)
            const totalAmount = (poolLongAmount + poolShortAmount) / 3
            if (netAmount < totalAmount) {
                netAmount = totalAmount
            }
            return Math.floor(netAmount * price)
        },
        keepMargin() {
            const { poolLongAmount, poolShortAmount, price } = this
            const value = (Math.abs(poolLongAmount - poolShortAmount) * price) / 5
            return value
        },
        tradeCoinLower() {
            return (this.tradeCoin || '').toLocaleLowerCase()
        },
        posAddressList() {
            return this.addressList.filter((e) => e.Lposition || e.Sposition)
        }
    },
    mounted() {
        if (this.contract) {
            this.getData()
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
                        direction: 'Long',
                        amount: this.formatNum(longAmount),
                        unrealizedPL: formatMoney(this.formatDecimals(longAmount * (this.price - longPrice))),
                        price: formatMoney(this.pricePrecision(longPrice))
                    }
                    tableData.push(obj)
                }
                if (shortAmount > 0) {
                    const obj = {
                        address: curList[i].Account,
                        direction: 'Short',
                        amount: this.formatNum(shortAmount),
                        unrealizedPL: formatMoney(this.formatDecimals(shortAmount * (shortPrice - this.price))),
                        price: formatMoney(this.pricePrecision(shortPrice))
                    }
                    tableData.push(obj)
                }
            })
            this.posTableData = tableData
        },
        async getData() {
            // this.loading = true
            await this.$store.dispatch('getPoolData')

            await this.getAllAccount(this.pairInfo.contract)
            const totalRes = await this.contract.methods.getPoolPosition().call()
            this.totalInfo = {
                longAmount: this.formatNum(totalRes[1]),
                shortAmount: this.formatNum(totalRes[3]),
                longNum: this.addressList.filter((e) => !!e.Lposition).length,
                shortNum: this.addressList.filter((e) => !!e.Sposition).length,
                totalNum: this.posAddressList.length
            }
            // this.loading = false
        }
    }
}
</script>

<style lang="scss" scoped>
.analyticss {
    background-color: var(--COLOR-bg1);
    height: calc(100vh - 40px);
    display: flex;
    width: 100%;
    .left-con {
        width: 200px;
        background: var(--COLOR-bg2);
        height: 100%;
        padding-top: 16px;
        box-sizing: border-box;
        .pair-item {
            height: 54px;
            width: 100%;
            display: flex;
            align-items: center;
            padding-left: 16px;
            font-size: 13px;
            color: var(--COLOR-t1);
            cursor: pointer;
            &.active {
                background: var(--COLOR-bg4);
            }
            img {
                width: 22px;
                height: 22px;
                margin-right: 8px;
            }
        }
    }
    .right-con {
        flex: 1;
        padding: 0 32px;
        .tab-con {
            display: flex;
            align-items: flex-end;
            padding: 32px 0;
            border-bottom: 1px solid var(--COLOR-bg3);
            .tab-item {
                font-size: 14px;
                color: var(--COLOR-t2);
                margin-right: 24px;
                cursor: pointer;
                margin-bottom: 5px;
                &.active {
                    color: var(--COLOR-t1);
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 0;
                }
            }
        }
        .content {
            background: var(--COLOR-bg2);
            border-radius: 24px;
            border: 1px solid var(--COLOR-bg4);
            margin-top: 32px;
            .item {
                width: 100%;
                display: flex;
                align-items: center;
                .label {
                    padding: 8px 0;
                    width: 240px;
                    box-sizing: border-box;
                    border-right: 1px solid var(--COLOR-bg4);
                    padding-right: 36px;
                    text-align: right;
                    font-size: 14px;
                    color: var(--COLOR-t2);
                }
                &:first-of-type .label {
                    padding-top: 16px;
                }
                &:last-of-type .label {
                    padding-bottom: 16px;
                }
                .value {
                    font-size: 14px;
                    padding-left: 36px;
                    color: var(--COLOR-t1);
                }
            }
        }
        .total-con {
            padding: 32px 0;
            display: flex;
            align-items: center;
            .item {
                display: flex;
                align-items: flex-end;
                font-size: 14px;
                margin-right: 40px;
                .label {
                    color: var(--COLOR-t1);
                    margin-right: 4px;
                }
                .value {
                    color: var(--COLOR-t2);
                }
            }
        }
        .table-con {
            width: 100%;
            .a-table {
                &.el-table {
                    border-radius: 24px;
                    background: var(--COLOR-bg2);
                    padding: 0 16px;

                    ::v-deep tr {
                        background-color: transparent;
                    }

                    ::v-deep th {
                        background-color: transparent;
                        border-bottom: 1px solid var(--COLOR-bg3);
                    }

                    ::v-deep .cell {
                        color: #fff;
                        font-size: 12px;
                        line-height: 32px;
                    }

                    ::v-deep th > .cell {
                        font-size: 12px;
                        line-height: 16px;
                        font-weight: normal !important;
                        color: var(--COLOR-t2);
                    }

                    ::v-deep td {
                        border: none;
                    }

                    &::before {
                        height: 0;
                    }

                    ::v-deep tr:hover > td {
                        background: transparent;
                    }

                    ::v-deep td {
                        padding: 6px 0;
                    }

                    ::v-deep .el-table__empty-text {
                        line-height: 80px;
                        margin-right: 40px;
                    }
                }
            }
            .a-pagination {
                ::v-deep .btn-prev,
                ::v-deep .el-pager,
                ::v-deep .btn-next,
                ::v-deep li {
                    background: transparent;
                }
                ::v-deep .btn-prev:disabled,
                ::v-deep .btn-next:disabled {
                    color: #303133;
                }
                ::v-deep .btn-prev,
                ::v-deep .number.active,
                ::v-deep .btn-next {
                    color: #fff;
                }
            }
        }
    }
}
</style>
