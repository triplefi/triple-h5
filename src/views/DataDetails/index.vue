<template>
    <div v-loading="loading" class="data-details">
        <el-tabs v-model="activeTab">
            <el-tab-pane v-for="e in pairs" :key="e.trade_coin" :label="e.trade_coin" :name="e.trade_coin">
            </el-tab-pane>
        </el-tabs>
        <div class="content">
            <div class="item">
                <div class="label">lp pool net</div>
                <div class="value">{{ poolNet }}</div>
            </div>
            <div class="item">
                <div class="label">lp pool unrealized P/L</div>
                <div class="value">{{ unrealizedPL }}</div>
            </div>
            <div class="item">
                <div class="label">lp pool usdt</div>
                <div class="value">{{ totalPool | formatMoney }}</div>
            </div>
            <div class="item">
                <div class="label">long amount</div>
                <div class="value">{{ poolLongAmount }}</div>
            </div>
            <div class="item">
                <div class="label">short amount</div>
                <div class="value">{{ poolShortAmount }}</div>
            </div>
            <div class="item">
                <div class="label">R</div>
                <div class="value">{{ R | formatNum(3) }}%</div>
            </div>
            <div class="item">
                <div class="label">pool used margin</div>
                <div class="value">{{ usedMargin | formatMoney }}</div>
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
            loading: false
        }
    },
    mounted() {
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
            'totalPool'
        ]),
        R() {
            const { poolLongAmount, poolShortAmount, poolNet, price, divConst } = this
            const rV = poolLongAmount - poolShortAmount // pool净头寸
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
            if (this.web3) {
                await this.initContract({ pairInfo: item })
                this.getData()
            }
        },
        async getData() {
            if (!this.contract) {
                return
            }
            const res = await Promise.all([this.contract.methods.getPoolNet().call()])
            this.$store.commit('setPoolNet', res[0] * 1)
            this.loading = false
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
}
</style>
