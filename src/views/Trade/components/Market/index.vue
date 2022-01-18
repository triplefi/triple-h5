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
                <span class="btn13 price">${{ pricePrecision(item.index_price) | formatMoney }}</span>
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
export default {
    name: 'Market',
    data() {
        return {
            query: ''
        }
    },
    computed: {
        ...mapState(['pairInfo', 'pairList']),
        showList() {
            if (this.query) {
                let reg = `${this.query}`
                let Reg = new RegExp(reg, 'i')
                return this.pairList.filter((item) => {
                    return item.trade_coin.match(Reg)
                })
            } else {
                return this.pairList
            }
        }
    },
    methods: {
        ...mapActions(['initContract', 'setPairCoin', 'setPairCoin']),
        checkActive(item) {
            return item.trade_coin.toUpperCase() == this.tradeCoin && item.margin_coin.toUpperCase() == this.marginCoin
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
