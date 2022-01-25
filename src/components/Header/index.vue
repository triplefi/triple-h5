<template>
    <div class="header">
        <router-link to="/" class="logo">
            <svg-icon icon-class="Logo" class-name="logo-1"></svg-icon>
            <svg-icon icon-class="Logo_2" class-name="logo-2"></svg-icon>
        </router-link>
        <router-link class="tab btn14" to="/trade">Trade</router-link>
        <router-link class="tab btn14" to="/pool">Pool</router-link>
        <el-button
            v-if="!!coinbase"
            :loading="getTokenLoading"
            :disabled="getTokenDisable"
            @click="handleGetTokens"
            type="primary"
            round
            size="mini"
            class="get-tokens-btn"
            >Get free test tokens</el-button
        >
        <!-- <router-link class="tab btn14" to="/about">Components</router-link> -->
        <!-- <div v-if="!coinbase" class="wallet btn14" @click="model = true">Ethereum</div> -->
        <div class="ethereum-network">
            <div class="flex flex-ac">
                <svg-icon :icon-class="curNetwork.icon" class-name="ethereum-icon"></svg-icon>
                {{ curNetwork.label }}
            </div>
            <div class="network-wrap">
                <div class="network-list">
                    <div
                        :class="`network-item ${item.id === chainId ? 'active' : ''}`"
                        v-for="item in networkTypeList"
                        :key="item.id"
                        @click="onSwitchNetwork(item)"
                    >
                        <svg-icon :icon-class="item.icon" :style="`font-size:${item.size}`"></svg-icon>
                        <span class="fs14">{{ item.label }}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="network-error" v-if="isNetworkError" @click="model = true">
            <svg-icon icon-class="ic_wrongNetwork" class="network-error-icon" />
            Wrong Network
        </div>
        <div v-else>
            <div v-if="!coinbase" class="wallet btn14" @click="model = true">Connect Wallet</div>
            <div v-else class="wallet2 fs14" @click="model = true">
                <span>{{ balance | formatBalance }} {{ curNetwork.token }}</span>
                <div class="address">
                    <span>{{ coinbase | formatCoinbase }}</span>
                    <svg-icon v-if="wallet === 'MetaMask'" icon-class="ic_metamask" class-name="icon-wallet"></svg-icon>
                    <svg-icon
                        v-if="wallet === 'WalletConnect'"
                        icon-class="ic_wallet"
                        class-name="icon-wallet"
                    ></svg-icon>
                </div>
            </div>
        </div>
        <!-- <svg-icon
      icon-class="ic_Add"
      class-name="s24 fullscreen"
      @click.native="getBalance()"
    ></svg-icon> -->
        <!-- <svg-icon
      icon-class="ic_Add"
      class-name="s24 fullscreen"
      @click.native="sendCoin()"
    ></svg-icon> -->
        <div class="more">
            <svg-icon icon-class="ic_more" class-name="s24 icon-more"></svg-icon>
            <div class="more-wrap">
                <div class="more-list">
                    <a :href="v" target="_blank" class="more-item" v-for="(v, k) in links" :key="k">
                        <span class="fs14">{{ k }}</span>
                        <svg-icon :icon-class="`ic_${k}`" class-name="fs16"></svg-icon>
                    </a>
                </div>
            </div>
        </div>
        <div @click="screenFull">
            <svg-icon :icon-class="`${isFull ? 'ic_Full2' : 'ic_Full1'}`" class-name="s24 fullscreen"></svg-icon>
        </div>

        <el-dialog title="Select a Wallet" :visible.sync="model" :show-header="false" width="375px">
            <div class="wallets" @click.stop="model = false">
                <!-- v-if="isMetaMask" -->
                <div class="wallet-item" @click="metaMaskInit">
                    <svg-icon icon-class="ic_metamask" class-name="icon"></svg-icon>
                    <h6>MetaMask</h6>
                </div>
                <!-- <a
          v-else
          class="wallet-item"
          target="_blank"
          href="https://metamask.io/"
          rel="noopener noreferrer"
        >
          <svg-icon icon-class="ic_metamask" class-name="icon"></svg-icon>
          <h6>MetaMask</h6>
        </a> -->
                <div class="wallet-item" @click="walletConnectInit">
                    <svg-icon icon-class="ic_wallet" class-name="icon"></svg-icon>
                    <h6>Wallet</h6>
                    <svg-icon
                        v-if="wallet === 'WalletConnect'"
                        icon-class="ic_close"
                        class-name="s24 close"
                        @click.native.stop="disconnect()"
                    ></svg-icon>
                </div>
                <a class="wallet-item" target="_blank" href="https://trustwallet.com/" rel="noopener noreferrer">
                    <svg-icon icon-class="ic_trust" class-name="icon"></svg-icon>
                    <h6>Trust</h6>
                </a>
                <a class="wallet-item" target="_blank" href="https://mathwallet.org/" rel="noopener noreferrer">
                    <svg-icon icon-class="ic_math" class-name="icon"></svg-icon>
                    <h6>Math</h6>
                </a>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { screenFull, exitFull, checkFull } from '@/utils/util'
import { getTestCoin } from '@/api'
export default {
    name: 'Header',
    data() {
        return {
            model: false,
            isFull: false,
            getTokenLoading: false,
            getTokenDisable: true,

            links: {
                FAQs: 'https://docs.triple.fi/',
                Twitter: 'https://twitter.com/TripleFi_',
                Medium: 'https://triplefi.medium.com/',
                Telegram: 'https://t.me/triplefi',
                Discord: 'https://discord.com/invite/Ar6aDuCuxY'
            },
            networkTypeList: [
                {
                    type: 'rinkeby',
                    id: 4,
                    label: 'Rinkeby',
                    icon: 'ic_rinkeby',
                    size: 18,
                    token: 'ETH',
                    rpc: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
                    explorerUrl: 'https://rinkeby.etherscan.io'
                },
                {
                    type: 'matic',
                    label: 'Polygon(Matic)',
                    icon: 'ic_matic',
                    id: 80001,
                    size: 16,
                    token: 'MATIC',
                    rpc: 'https://rpc-mumbai.maticvigil.com',
                    explorerUrl: 'https://mumbai.polygonscan.com/'
                }
            ]
        }
    },
    computed: {
        ...mapState(['provider', 'coinbase', 'balance', 'wallet', 'isMetaMask', 'isNetworkError', 'chainId']),
        curNetwork() {
            const info = this.networkTypeList.find((e) => e.id == this.chainId)
            console.log(this.chainId, info)
            return info || this.networkTypeList[0]
        }
    },
    filters: {
        formatCoinbase(val) {
            return val ? val.slice(0, 6) + '...' + val.slice(-4) : ''
        },
        formatBalance(val) {
            // return Number(val).toFixed(4);
            return val
        }
    },
    watch: {
        coinbase() {
            if (this.coinbase) {
                this.calcGetTokensBtn()
            }
        }
    },
    mounted() {
        checkFull(this)
        this.calcGetTokensBtn()
    },
    methods: {
        ...mapActions(['metaMaskInit', 'walletConnectInit', 'disconnect']),
        screenFull() {
            if (this.isFull) {
                exitFull()
            } else {
                screenFull()
            }
        },
        calcGetTokensBtn() {
            const getTokensTime = window.localStorage.getItem(`${this.coinbase}-get-test-tokens`) || 0
            const now = new Date().getTime()
            this.getTokenDisable = now - getTokensTime <= 5 * 60 * 1000
        },
        async onSwitchNetwork(item) {
            if (this.provider) {
                const chainId = '0x' + parseInt(item.id).toString(16)
                try {
                    await this.provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId }]
                    })
                } catch (switchError) {
                    if (switchError.code === 4902) {
                        try {
                            await this.provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [
                                    {
                                        chainId,
                                        chainName: item.label,
                                        rpcUrls: [item.rpc],
                                        blockExplorerUrls: [item.explorerUrl]
                                    }
                                ]
                            })
                        } catch (addError) {
                            console.log(addError)
                            // handle "add" error
                        }
                    }
                }
            } else {
                this.$message({
                    type: 'error',
                    message: 'Please connect wallet first.'
                })
            }
        },
        async handleGetTokens() {
            this.getTokenLoading = true
            try {
                const res = await getTestCoin(this.coinbase)
                this.getTokenLoading = false
                window.localStorage.setItem(`${this.coinbase}-get-test-tokens`, new Date().getTime())
                this.getTokenDisable = true
                if (res.result) {
                    this.$message({
                        type: 'success',
                        message: 'Succeeded! 0.1ETH and 10000USDT will be in your Rinkeby wallet soon.'
                    })
                } else {
                    this.$message({
                        type: 'error',
                        message:
                            'Transaction failure. Your address has already recieved  maximum amount of free tokens.'
                    })
                }
            } catch (error) {
                this.getTokenLoading = false
                this.$message({
                    type: 'error',
                    message: error
                })
            }
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
