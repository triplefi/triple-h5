<template>
    <div class="page trade">
        <Market></Market>
        <div class="flex-1">
            <div class="flex mis">
                <div class="flex-1 mid">
                    <Current></Current>
                    <!-- <div class="kline">
            <img src="./kline.png" width="100%" height="100%" alt="" />
          </div> -->
                    <Kline></Kline>
                    <Action></Action>
                </div>
                <div class="right">
                    <Deal></Deal>
                    <Account></Account>
                </div>
            </div>
            <Order></Order>
        </div>
    </div>
</template>

<script>
import Market from './components/Market'
import Current from './components/Current'
import Action from './components/Action'
import Deal from './components/Deal'
import Account from './components/Account'
import Order from './components/Order'
import Kline from './components/Kline'
import networkMixin from '@/components/networkMixin'
import { mapState } from 'vuex'
import { checkMain } from '@/utils/util'
export default {
    name: 'Trade',
    mixins: [networkMixin],
    components: {
        Market,
        Current,
        Action,
        Deal,
        Account,
        Order,
        Kline
    },
    computed: {
        ...mapState(['chainId', 'provider']),
        isUnlocked() {
            return this.provider?._state?.isUnlocked
        }
    },
    watch: {
        isUnlocked() {
            this.showDialog()
        },
        chainId: {
            immediate: true,
            handler(v) {
                this.showDialog()
            }
        }
    },
    methods: {
        showDialog() {
            if (this.chainId && this.isUnlocked) {
                const key = `isFirstTrade${this.chainId}`
                const isShowTips = window.localStorage.getItem(key) || 0
                window.localStorage.setItem(key, 1)
                if (parseInt(isShowTips) === 0) {
                    if (checkMain(this.chainId)) {
                        this.$alert(
                            `<div style="line-height:40px;font-size:15px;">Dear traders,</br></br>
    Welcome to use TripleFi!</br>
    Please have USDT (polygon) and Matic in your wallet first.</br>
    Then click the “Approve” button and have fun trading!</br>
    You can also switch to Mumbai Testnet to test with stimulated trading for free.</br></br></div>`,
                            {
                                confirmButtonText: 'Confirm',
                                dangerouslyUseHTMLString: true
                            }
                        )
                    } else {
                        this.$alert(
                            `<div style="line-height:40px;font-size:15px;">Dear users,</br></br>
    Welcome to use the Triple.Fi stimulated trading version! Please follow the steps below,</br>
    1. Switch your wallet to Ethereum Mumbai Test Network.</br>
    2. Get free test tokens on the top left corner.</br>
    3. Click “Approve” button and have fun trading!</br></br></div>`,
                            {
                                confirmButtonText: 'Confirm',
                                dangerouslyUseHTMLString: true
                            }
                        )
                    }
                }
            }
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
