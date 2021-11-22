<template>
    <div class="data-details">
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
                <div class="value">{{ poolUsdt }}</div>
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
                <div class="value">{{ R }}</div>
            </div>
            <div class="item">
                <div class="label">pool used margin</div>
                <div class="value">{{ usedMargin }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
export default {
    data() {
        return {
            poolLongPrice: 0,
            poolShortPrice: 0
        }
    },
    mounted() {
        this.timeHandler = setInterval(() => {
            this.getPoolPrice()
        }, 3000)
    },
    beforeDestroy() {
        if (this.timeHandler) {
            clearInterval(this.timeHandler)
        }
    },
    computed: {
        ...mapState(['contract', 'poolNet', 'price', 'divConst', 'price', 'poolLongAmount', 'poolShortAmount']),
        // ...mapGetters([]),
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
        },
        poolUsdt() {
            return this.poolNet * this.price
        }
    },
    methods: {
        async getPoolPrice() {
            const res = await Promise.all([
                this.contract.methods.poolLongPrice().call(),
                this.contract.methods.poolShortPrice().call()
            ])
            this.poolLongPrice = res[0]
            this.poolShortPrice = res[1]
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
