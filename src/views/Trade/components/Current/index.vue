<template>
    <div class="current">
        <div class="icons">
            <div class="icon icon-1">
                <img :src="tradeCoin | getCoinIcon" alt="" />
            </div>
            <div class="icon icon-2">
                <img :src="marginCoin | getCoinIcon" alt="" />
            </div>
        </div>
        <h5>{{ symbol }}</h5>
        <h5 class="price">${{ pricePrecision(NewPrice) | formatMoney }}</h5>
        <div class="item">
            <div class="fs12 name">Index Price</div>
            <div class="fs12b value">${{ pricePrecision(price) | formatMoney }}</div>
        </div>
        <div class="item">
            <div class="fs12 name">Liquidity Pool</div>
            <div class="fs12b value">
                {{ formatDecimals(poolNet) | formatMoney }}
            </div>
        </div>
        <div class="item">
            <div class="fs12 name">Funding Rate / Next Funding</div>
            <div class="fs12b value">{{ (fundingRate * 100) | formatNum(3, true) }}% / {{ state }}</div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
dayjs.extend(utc)
// "1: getLatestPrice来获取价格
// 2:
// 3: totalPool对冲池总量
// 4:     //开仓量精度或者最小开仓量，此代表10的x次方，比如每张合约对应0.001个btc，则此值为-3
//     int8 public immutable amountDecimal;
//     //总池的多仓持仓量和空仓持仓量，单位为“张”
//     uint256 public poolLongAmount;
//     uint256 public poolShortAmount;
//     //总池的多仓价格和仓价格，单位为“wtoken0/张”，也就是每张合约的价值为token0个代币乘以token0的精度
//     uint256 public poolLongPrice;
//     uint256 public poolShortPrice;"
export default {
    name: 'Current',
    data() {
        return {
            newPrice: '',
            state: ''
            // fundingRate: "",
        }
    },
    computed: {
        ...mapState(['contract', 'fundingRate', 'poolNet']),
        ...mapGetters(['NewPrice', 'symbol'])
    },
    mounted() {
        this.calcCountdown()
        this.intervalHandler = setInterval(this.calcCountdown, 1000)
    },
    beforeDestroy() {
        if (this.intervalHandler) {
            clearInterval(this.intervalHandler)
        }
    },
    methods: {
        calcCountdown() {
            const utcTimeStr = `${dayjs().add(1, 'd').utc().format('YYYY-MM-DD')} 00:00:00`
            const utcNowStr = dayjs().utc().format('YYYY-MM-DD HH:mm:ss')
            const utcTime = dayjs(utcTimeStr).utc().unix()
            const nowTime = dayjs(utcNowStr).utc().unix()
            const next = utcTime - nowTime
            // utc时间0点-0点五分，为处理中
            if (next <= 5 * 60) {
                this.state = 'Proceeding'
            } else {
                let h = (parseInt(next / 3600) || 0) + ''
                let m = parseInt((next % 3600) / 60) + ''
                let s = parseInt((next % 3600) % 60) + ''
                h = h.length === 1 ? `0${h}` : h
                m = m.length === 1 ? `0${m}` : m
                s = s.length === 1 ? `0${s}` : s
                this.state = `${h}:${m}:${s}`
            }
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
