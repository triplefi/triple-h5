<template>
    <div class="market">
        <div class="title">
            <span class="btn14">Select Market</span>
            <!-- <div class="line"></div> -->
        </div>
        <div class="search">
            <div class="search-input">
                <svg-icon icon-class="ic_Search" class-name="icon-search"></svg-icon>
                <input class="input fs14" type="text" placeholder="Search..." v-model="query" @input="handleSearch" />
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
                @click="!checkActive(item) && selectPair(item)"
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
import { getTradePairs } from '@/api'
import { mapActions } from 'vuex'
export default {
    name: 'Market',
    data() {
        return {
            query: '',
            list: [],
            showList: [],
            interval: null
        }
    },
    watch: {
        web3: {
            handler(n) {
                n && this.list.length && this.init()
            },
            immediate: true
        }
    },
    async created() {
        const list = await this.getList()
        if (list.length > 0) {
            this.list = [...list]
            this.showList = [...list]
        }
        list.length && this.init()
    },
    mounted() {
        this.interval = setInterval(() => {
            this.getList()
        }, 3000)
    },
    beforeDestroy() {
        this.interval && clearInterval(this.interval)
    },
    methods: {
        ...mapActions(['initContract']),
        async getList() {
            try {
                const res = await getTradePairs()
                if (res.result) {
                    this.list = res.data
                }
                return this.list
            } catch (error) {
                console.log(error)
                this.getList()
            }
        },
        init() {
            let pairInfo = localStorage.getItem('pairInfo')
            if (pairInfo) {
                pairInfo = JSON.parse(pairInfo)
                if (this.list.find((e) => e.contract === pairInfo.contract)) {
                    this.selectPair(pairInfo)
                } else {
                    this.selectPair(this.list[0])
                }
            } else {
                this.selectPair(this.list[0])
            }
        },
        selectPair(item) {
            console.log('selectPair', item)
            localStorage.setItem('pairInfo', JSON.stringify(item))
            this.$store.commit('setContractAddress', item.contract)
            this.$store.commit('setPairInfo', item)
            this.web3 && this.initContract({ pairInfo: item })
        },
        checkActive(item) {
            return item.trade_coin.toUpperCase() == this.tradeCoin && item.margin_coin.toUpperCase() == this.marginCoin
        },
        handleSearch(e) {
            let reg = `${e.target.value}`
            let Reg = new RegExp(reg, 'i')

            this.showList = this.list.filter((item) => {
                return item.trade_coin.match(Reg)
            })
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
