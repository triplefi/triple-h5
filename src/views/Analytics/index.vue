<template>
    <div v-loading="loading" class="analyticss">
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
            <div v-if="curTab == 1">
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
        </div>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
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
            ]
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
        }
    },
    methods: {
        ...mapActions(['setPairCoin']),
        async getData() {
            await this.$store.dispatch('getPoolData')
            this.loading = false
        }
    }
}
</script>

<style lang="scss" scoped>
.analyticss {
    background-color: var(--COLOR-bg1);
    height: calc(100vh - 40px);
    display: flex;
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
    }
}
</style>
