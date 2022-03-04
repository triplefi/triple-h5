<template>
    <div class="market">
        <div class="title">
            <span class="btn14">Select Market</span>
            <!-- <div class="line"></div> -->
        </div>
        <div class="search">
            <div class="search-input">
                <svg-icon icon-class="ic_Search" class-name="icon-search"></svg-icon>
                <input class="input fs14" type="text" placeholder="Search..." v-model="query" />
            </div>
            <div class="curreny">
                <!-- <div class="fs14b">ETH</div> -->
                <div class="fs14b active">USDT</div>
                <!-- <div class="fs14b">USDC</div>
                <div class="fs14b">DAI</div> -->
            </div>
        </div>
        <div class="coins">
            <div
                class="coin"
                :class="[checkActive(item) ? 'active' : '', item.index_price - item.open_price >= 0 ? 'up' : 'dw']"
                v-for="item in showList"
                :key="item.trade_coin"
                @click="!checkActive(item) && setPairCoin(item)"
            >
                <img class="icon" :src="item.trade_coin.toUpperCase() | getCoinIcon" alt="" />
                <span class="btn13">{{ item.trade_coin.toUpperCase() }}</span>
                <span class="fs13 code"></span>
                <span class="btn13 price">${{ calcPricePrecision(item) | formatMoney }}</span>
                <div class="btn13 rate">
                    {{ item.index_price - item.open_price >= 0 ? '+' : ''
                    }}{{ (((item.index_price - item.open_price) / item.open_price) * 100).toFixed(2) }}%
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { formatNum } from '@/utils/util'
import abi from '@/contracts/HedgexSingle.json'
export default {
    name: 'Market',
    data() {
        return {
            query: '',
            decimalsInfo: {}
        }
    },
    computed: {
        ...mapState(['pairInfo', 'pairList', 'ready']),
        showList() {
            let list = []
            if (this.query) {
                let reg = `${this.query}`
                let Reg = new RegExp(reg, 'i')
                list = this.pairList.filter((item) => {
                    return item.trade_coin.match(Reg)
                })
            } else {
                list = [...this.pairList]
            }
            return list
        }
    },
    watch: {
        pairInfo() {
            this.initDecimalsInfo()
        },
        ready(v) {
            if (v) {
                this.initDecimalsInfo()
            }
        },
        pairList(v) {
            if (this.web3) {
                v.forEach(async (item) => {
                    const key = `${item.trade_coin}_${item.margin_coin}`
                    if (!this.decimalsInfo[key]) {
                        const contract = new this.web3.eth.Contract(abi, item.contract)
                        const amountDecimal = await contract.methods.amountDecimal().call()
                        const decimals = await contract.methods.decimals().call()
                        this.decimalsInfo[key] = {
                            amountDecimal,
                            decimals
                        }
                    }
                })
            }
        }
    },
    methods: {
        ...mapActions(['initContract', 'setPairCoin', 'setPairCoin']),
        initDecimalsInfo() {
            const v = this.pairInfo
            if (v?.trade_coin) {
                if (this.amountDecimal || this.decimals) {
                    const key = `${v.trade_coin}_${v.margin_coin}`
                    this.decimalsInfo[key] = {
                        amountDecimal: this.amountDecimal,
                        decimals: this.decimals
                    }
                }
            }
            console.log(JSON.stringify(this.decimalsInfo), '-=---')
        },
        checkActive(item) {
            return item.trade_coin.toUpperCase() == this.tradeCoin && item.margin_coin.toUpperCase() == this.marginCoin
        },
        calcPricePrecision(item) {
            const key = `${item.trade_coin}_${item.margin_coin}`
            const { decimals, amountDecimal } = this.decimalsInfo[key] || {}
            if (decimals || amountDecimal) {
                const _decimals = (decimals || 0) * 1 + (amountDecimal || 0) * 1
                return formatNum(item.index_price / Math.pow(10, _decimals), _decimals)
            }
            return 0
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
