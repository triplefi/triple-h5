<template>
    <div v-loading="loading" class="data-details">
        <el-tabs v-model="activeTab">
            <el-tab-pane v-for="e in pairs" :key="e.trade_coin" :label="e.trade_coin" :name="e.trade_coin">
            </el-tab-pane>
        </el-tabs>
        <div class="content">
            <div class="item">
                <div class="label">lp pool net</div>
                <div class="value">{{ formatDecimals(poolNet) }}</div>
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
                <div class="value">{{ amountPrecision(poolLongAmount) }}</div>
            </div>
            <div class="item">
                <div class="label">short amount</div>
                <div class="value">{{ amountPrecision(poolShortAmount) }}</div>
            </div>
            <div class="item">
                <div class="label">R</div>
                <div class="value">{{ R | formatNum(3) }}%</div>
            </div>
            <div class="item">
                <div class="label">pool used margin</div>
                <div class="value">{{ formatDecimals(usedMargin) | formatMoney }}</div>
            </div>
        </div>
        <div class="explosive-con">
            <el-input v-model="explosiveAddress" placeholder="请输入爆仓地址"></el-input>
            <el-button :loading="explosiveLoading" @click="handleExplosive" type="primary">确定爆仓</el-button>
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
            explosiveLoading: false
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
            'pairInfo'
        ]),
        R() {
            const { poolLongAmount, poolShortAmount, poolNet, price, divConst } = this
            const rV = this.amountPrecision(poolLongAmount - poolShortAmount) // pool净头寸
            return poolNet ? ((rV * price) / poolNet) * divConst || 0 : 0 //净头⼨⽐率
        },
        unrealizedPL() {
            const { poolLongAmount, poolLongPrice, poolShortAmount, poolShortPrice, price } = this
            const longUpl = poolLongAmount * (price - poolLongPrice)
            const shortUpl = poolShortAmount * (poolShortPrice - price)
            return longUpl + shortUpl
        },
        usedMargin() {
            const { poolLongAmount, poolShortAmount, price } = this
            let netAmount = Math.abs(poolShortAmount - poolShortAmount)
            const totalAmount = (poolLongAmount + poolShortAmount) / 3
            if (netAmount < totalAmount) {
                netAmount = totalAmount
            }
            return Math.floor(netAmount * price)
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
        async getPairs() {
            this.loading = true
            const res = await getTradePairs()
            if (res.result) {
                this.pairs = res.data
                this.activeTab = this.pairs[0].trade_coin
            }
            return this.pairs
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
                await this.$store.dispatch('getPoolData')
                this.loading = false
            }
        },
        async handleExplosive() {
            if (!this.explosiveAddress) {
                return this.$message({
                    type: 'error',
                    message: '请输入爆仓地址'
                })
            }
            if (!this.web3 || !this.contract) {
                return this.$message({
                    type: 'error',
                    message: '合约初始化未完成'
                })
            }
            this.explosiveLoading = true
            try {
                await this.contract.methods.explosive(this.explosiveAddress).send({ from: this.coinbase })
                this.explosiveLoading = false
                this.$message({
                    type: 'success',
                    message: '执行完成'
                })
            } catch (error) {
                this.$message({
                    type: 'error',
                    message: error
                })
                this.explosiveLoading = false
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
                width: 240px;
            }
        }
    }
    .explosive-con {
        padding: 20px 60px;
        .el-input {
            width: 300px;
            margin-right: 30px;
        }
    }
}
</style>
