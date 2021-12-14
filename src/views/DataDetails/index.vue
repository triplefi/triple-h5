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
        <div class="explosive-con">
            <div>
                <el-input v-model="explosiveAddress" placeholder="请输入爆仓地址"></el-input>
            </div>
            <div>
                <el-input v-model="explosiveTo" placeholder="请输入奖励地址"></el-input>
            </div>
            <div>
                <el-button :loading="explosiveLoading" @click="handleExplosive" type="primary">确定爆仓</el-button>
            </div>
        </div>
        <div class="explosive-con">
            <div>
                <el-input v-model="detectSlideAddress" placeholder="请输入Account Address"></el-input>
            </div>
            <div>
                <el-input v-model="detectSlideTo" placeholder="请输入To Address"></el-input>
            </div>
            <div>
                <el-button :loading="detectSlideLoading" @click="handleDetectSlide" type="primary">测试利息</el-button>
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
                await this.$store.dispatch('getPoolData')
                this.loading = false
                this.explosiveLoading = false
            }
        },
        // 爆仓测试
        async handleExplosive() {
            if (!this.explosiveAddress) {
                return this.$message({
                    type: 'error',
                    message: '请输入爆仓地址'
                })
            }
            if (!this.explosiveTo) {
                return this.$message({
                    type: 'error',
                    message: '请输入奖励地址'
                })
            }
            if (!this.web3 || !this.contract) {
                return this.$message({
                    type: 'error',
                    message: '合约初始化未完成'
                })
            }
            this.explosiveLoading = true
            console.log(this.explosiveAddress, this.explosiveTo, '-----')
            try {
                await this.contract.methods
                    .explosive(this.explosiveAddress, this.explosiveTo)
                    .send({ from: this.coinbase })
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
        },
        // 利息测试
        async handleDetectSlide() {
            if (!this.detectSlideAddress) {
                return this.$message({
                    type: 'error',
                    message: '请输入Account Address'
                })
            }
            if (!this.detectSlideTo) {
                return this.$message({
                    type: 'error',
                    message: '请输入To Address'
                })
            }
            if (!this.web3 || !this.contract) {
                return this.$message({
                    type: 'error',
                    message: '合约初始化未完成'
                })
            }
            this.detectSlideLoading = true
            try {
                await this.contract.methods
                    .detectSlide(this.detectSlideAddress, this.detectSlideTo)
                    .send({ from: this.coinbase })
                this.detectSlideLoading = false
                this.$message({
                    type: 'success',
                    message: '执行完成'
                })
            } catch (error) {
                this.$message({
                    type: 'error',
                    message: error
                })
                this.detectSlideLoading = false
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
