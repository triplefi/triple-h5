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
    mounted() {
        const isShowTips = window.localStorage.getItem('isFirstTrade') || 0
        window.localStorage.setItem('isFirstTrade', 1)
        if (parseInt(isShowTips) === 0) {
            this.$alert(
                `<div style="line-height:40px;font-size:15px;">Dear users,</br></br>
Welcome to use the Triple.Fi Beta version! Please follow the steps below,</br>
1. Switch your wallet to Ethereum Rinkeby Test Network.</br>
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
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
