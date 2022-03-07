<template>
    <div id="app">
        <Header v-show="$route.name != 'Home'"></Header>
        <router-view />
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
    watch: {
        async '$route.name'(v) {
            if (v !== 'Home' && !this.web3) {
                const wallet = localStorage.getItem('wallet')
                if (wallet === 'MetaMask') {
                    await this.metaMaskInit()
                } else if (wallet === 'WalletConnect') {
                    await this.walletConnectInit()
                } else {
                    await this.getPairsList()
                }
            }
        }
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
