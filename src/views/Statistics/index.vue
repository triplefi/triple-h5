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
                <div class="label">多仓持仓人数</div>
                <div class="value">{{ formatDecimals(poolNet) | formatMoney }}</div>
            </div>
            <div class="item">
                <div class="label">空仓持仓人数</div>
                <div class="value">{{ formatDecimals(unrealizedPL) }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import { getTradePairs } from '@/api'
import { mapState, mapActions } from 'vuex'
export default {
    data() {
        return {
            pairs: [],
            activeTab: '',
            loading: false,
            explosiveAddress: '',
            explosiveTo: '',
            explosiveLoading: false,
            detectSlideAddress: '',
            detectSlideTo: '',
            detectSlideLoading: false
        }
    },
    mounted() {
        this._initWeb3 = !!this.web3
        this.getPairs()
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
            'poolState'
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
        }
    },
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
        }
    },
    methods: {
        ...mapActions(['initContract']),
        // contractEvents(){
        //     state.contract.getPastEvents(
        //     'ExplosivePool',
        //     {
        //         fromBlock: 0,
        //         toBlock: 'latest'
        //     },
        //     (err, event) => {
        //         if (err) {
        //             console.log(err)
        //         } else {
        //             console.log('PastTrades', event)
        //             if (event.length) {
        //                 const _list = event.map((item) => {
        //                     const { amount, direction, price } = item.returnValues
        //                     return {
        //                         amount,
        //                         direction,
        //                         price,
        //                         blockNumber: item.blockNumber,
        //                         transactionHash: item.transactionHash
        //                     }
        //                 })
        //                 _list.forEach(async (item) => {
        //                     const block = await state.web3.eth.getBlock(item.blockNumber)
        //                     item.time = block.timestamp * 1000
        //                     commit('setTrade', item)
        //                 })
        //             }
        //         }
        //     }
        // )
        // },
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
                this.timeHandler = setInterval(() => {
                    this.getOrderList()
                }, 3000)
            }
        },
        async getOrderList() {
            const res = await this.contract.methods.getPoolPosition().call()
            console.log(res)
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
                width: 300px;
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
