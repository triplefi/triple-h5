<template>
    <div id="app">
        <Header v-show="$route.name != 'Home'"></Header>
        <router-view v-if="initWeb3" />
    </div>
</template>

<script>
import Header from './components/Header'
import { mapActions } from 'vuex'
export default {
    data() {
        return {
            initWeb3: false
        }
    },
    components: {
        Header
    },
    methods: {
        ...mapActions(['metaMaskInit', 'walletConnectInit', 'getPairsList'])
    },
    async mounted() {
        const wallet = localStorage.getItem('wallet')
        if (this.$route.name != 'Home') {
            this.initWeb3 = true
        }
        if (wallet === 'MetaMask') {
            await this.metaMaskInit()
        } else if (wallet === 'WalletConnect') {
            await this.walletConnectInit()
        } else {
            await this.getPairsList()
        }
        this.initWeb3 = true
    }
}
</script>

<style lang="scss" scoped>
#app {
    min-height: 100vh;
    width: 100%;
    background: var(--COLOR-bg1);
}
</style>
