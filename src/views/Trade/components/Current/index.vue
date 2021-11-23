<template>
    <div class="current">
        <div class="icons">
            <div class="icon icon-1">
                <img :src="require(`@/assets/coin/coin_${tradeCoin}.png`)" alt="" />
            </div>
            <div class="icon icon-2">
                <img :src="require(`@/assets/coin/coin_${marginCoin}.png`)" alt="" />
            </div>
        </div>
        <h5>{{ symbol }}</h5>
        <h5 class="price">${{ pricePrecision(NewPrice) | formatMoney }}</h5>
        <div class="item">
            <div class="fs12 name">Index Price</div>
            <div class="fs12b value">${{ pricePrecision(price) | formatMoney }}</div>
        </div>
        <div class="item">
            <div class="fs12 name">Triple Pool</div>
            <div class="fs12b value">
                {{ formatDecimals(totalPool) | formatMoney }}
            </div>
        </div>
        <div class="item">
            <div class="fs12 name">Funding Rate</div>
            <div class="fs12b value">{{ (fundingRate * 100) | formatNum(3) }}%</div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
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
            newPrice: ''
            // fundingRate: "",
        }
    },
    computed: {
        ...mapState(['contract', 'fundingRate', 'totalPool']),
        ...mapGetters(['NewPrice', 'symbol'])
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
