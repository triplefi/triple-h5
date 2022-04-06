<template>
    <div class="account">
        <div class="account-title">Account - USDT</div>
        <div class="flex flex-ac flex-bt">
            <div class="fs12 name">Wallet</div>
            <div class="fs12 value">
                {{ parseFloat(formatDecimals(token0Balance)).toFixed(2) | formatMoney }}
            </div>
            <!-- <div class="fs12 transfer" @click="transfer">Transfer</div> -->
            <el-button @click="transfer" type="primary" round size="mini" class="transfer">Transfer</el-button>
        </div>
        <div class="flex flex-ac flex-bt">
            <div class="fs12 name">Margin</div>
            <div class="fs12 value">
                {{ formatDecimals(position.margin) | formatMoney }}
            </div>
        </div>
        <div class="flex flex-ac flex-bt">
            <div class="fs12 name">Equity</div>
            <div class="fs12 value">{{ formatDecimals(NetValue) | formatMoney }}</div>
        </div>
        <div class="flex flex-ac flex-bt">
            <el-tooltip effect="dark" placement="left">
                <div slot="content">
                    Deposit will lower the account leverage and it will lower the risk of liquidation and the Est.
                    Liquidation Price will move further from the current market price.
                </div>
                <div class="fs12 name c-help">Est. Liquidate Price</div>
            </el-tooltip>
            <div
                class="fs12 value"
                :class="{ 'click-transfer': liquidationStatus == 1 }"
                @click="
                    () => {
                        liquidationStatus == 1 && transfer()
                    }
                "
                v-if="liquidationStatus > 0"
            >
                {{ pricePrecision(LiquidationPrice) | formatMoney }}
            </div>
            <div class="fs12 value" v-else>--</div>
        </div>
        <div class="flex flex-ac flex-bt">
            <div class="fs12 name">Used Margin</div>
            <div class="fs12 value">
                {{ formatDecimals(UsedMargin) | formatMoney }}
            </div>
        </div>
        <div class="flex flex-ac flex-bt">
            <div class="fs12 name">Maintenance Margin</div>
            <div class="fs12 value">
                {{ formatDecimals(keepMargin) | formatMoney }}
            </div>
        </div>
        <div class="profit-con" v-if="profitInfo && profitInfo.pair === symbol" :key="profitInfo.transactionHash">
            <div class="close-con">
                <div class="leverage-con">
                    <span class="long-flag" v-if="profitInfo.direction == -2">Long</span>
                    <span class="short-flag" v-else>Short</span>
                    <span>{{ leverage }}X</span>
                    <span>{{ profitInfo.pair }}</span>
                </div>
                <svg-icon icon-class="ic_close" class-name="close" @click.native.stop="handleCloseProfit()"></svg-icon>
            </div>
            <div>
                <div class="label">Amount</div>
                <div class="value">{{ amountPrecision(profitInfo.amount) | formatMoney }}</div>
            </div>
            <div>
                <div class="label">Open Price</div>
                <div class="value">{{ pricePrecision(profitInfo.openPrice) | formatMoney }}</div>
            </div>
            <div>
                <div class="label">Close Price</div>
                <div class="value">{{ pricePrecision(profitInfo.closePrice) | formatMoney }}</div>
            </div>
            <div class="profit-bg">
                <div class="label">
                    <span class="profit-label">Profit{{ profitInfo.isShowR ? '%' : '' }}</span
                    ><template v-if="!profitInfo.isShowR">USDT</template>
                </div>
                <div v-if="profitInfo.isShowR" class="value profit-value">
                    {{ profitInfo.R }}
                </div>
                <div class="value profit-value" v-else>{{ profitInfo.profit | formatMoney }}</div>
                <div class="amount-ani value">+ {{ profitInfo.profit | formatMoney }}</div>
            </div>
            <div class="icon-con">
                <div @click="exchangeProfitInfo" class="icon-left">
                    <svg-icon icon-class="exchange" class-name="icon"></svg-icon>
                </div>
                <div class="icon-right">
                    <div @click="handleDownload()">
                        <svg-icon icon-class="download" class-name="icon"></svg-icon>
                    </div>
                    <a data-sharer="twitter" :data-title="shareStr" :data-url="shareUrl">
                        <svg-icon icon-class="twitter" class-name="icon"></svg-icon>
                    </a>
                    <a data-sharer="telegram" :data-title="shareStr" :data-url="shareUrl">
                        <svg-icon icon-class="telegram" class-name="icon"></svg-icon>
                    </a>
                    <a target="blank" href="https://discord.com/invite/Ar6aDuCuxY">
                        <svg-icon icon-class="discoed" class-name="icon"></svg-icon>
                    </a>
                </div>
            </div>
        </div>

        <el-dialog title="Margin Transfer" :visible.sync="showTab" :close-on-click-modal="false" width="375px">
            <div class="content-tab">
                <el-tabs v-model="activeName" type="card">
                    <div class="fs12" v-if="UsedMargin">
                        Reminder: Deposit will lower the account leverage and it will lower the risk of liquidation.
                    </div>
                    <el-tab-pane label="Deposit" name="recharge">
                        <el-input-number
                            style="width: 100%; margin-top: 20px"
                            v-model="amount1"
                            :controls="false"
                            :precision="precision"
                            :step="step"
                            :min="0"
                            :max="maxRecharge"
                        ></el-input-number>
                        <div class="flex available">
                            <div class="flex-1 fs14">Available {{ maxRecharge }}</div>
                            <div class="fs14b max" @click="handleMax()">Max</div>
                        </div>
                        <el-button style="width: 100%" type="primary" round @click="handleRechargeMargin"
                            >Confirm</el-button
                        >
                    </el-tab-pane>
                    <el-tab-pane label="Withdraw" name="withdraw">
                        <el-input-number
                            :controls="false"
                            style="width: 100%; margin-top: 20px"
                            v-model="amount2"
                            :precision="precision"
                            :step="step"
                            :min="0"
                            :max="maxWithdraw"
                        ></el-input-number>
                        <div class="flex available">
                            <div class="flex-1 fs14">Available {{ maxWithdraw }}</div>
                            <div class="fs14b max" @click="handleMax()">Max</div>
                        </div>
                        <el-button style="width: 100%" type="primary" round @click="handleWithdrawMargin"
                            >Confirm</el-button
                        >
                    </el-tab-pane>
                </el-tabs>
            </div>
        </el-dialog>
        <el-dialog
            v-if="profitInfo"
            custom-class="profit-dialog-con"
            width="520px"
            :visible.sync="showProfitCard"
            :modal="false"
            :show-close="false"
        >
            <template slot="title"></template>
            <div id="profit-card" class="profit-card-con">
                <div class="profit-con" :key="profitInfo.transactionHash">
                    <div class="close-con">
                        <div class="leverage-con">
                            <span class="long-flag" v-if="profitInfo.direction == -2">Long</span>
                            <span class="short-flag" v-else>Short</span>
                            <span>{{ leverage }}X</span>
                        </div>
                        <div class="icons">
                            <div class="icon icon-1">
                                <img :src="profitInfo.pair.split('/')[0] | getCoinIcon" alt="" />
                            </div>
                            <div class="icon icon-2">
                                <img :src="profitInfo.pair.split('/')[1] | getCoinIcon" alt="" />
                            </div>
                            <span>{{ profitInfo.pair }}</span>
                        </div>
                        <!-- <svg-icon
                            icon-class="ic_close"
                            class-name="close"
                            @click.native.stop="handleCloseProfit()"
                        ></svg-icon> -->
                    </div>
                    <div>
                        <div class="label">Amount</div>
                        <div class="value">{{ amountPrecision(profitInfo.amount) | formatMoney }}</div>
                    </div>
                    <div>
                        <div class="label">Open Price</div>
                        <div class="value">{{ pricePrecision(profitInfo.openPrice) | formatMoney }}</div>
                    </div>
                    <div>
                        <div class="label">Close Price</div>
                        <div class="value">{{ pricePrecision(profitInfo.closePrice) | formatMoney }}</div>
                    </div>
                    <div class="profit-bg">
                        <div class="label">
                            <span class="profit-label">Profit{{ profitInfo.isShowR ? '%' : '' }}</span
                            ><template v-if="!profitInfo.isShowR">USDT</template>
                        </div>
                        <div v-if="profitInfo.isShowR" class="value profit-value">
                            {{ profitInfo.R }}
                        </div>
                        <div class="value profit-value" v-else>{{ profitInfo.profit | formatMoney }}</div>
                    </div>
                </div>
                <div class="bottom-info">
                    <div>
                        <img class="icon" src="./website.png" alt="" />
                        <span>https://triple.fi/</span>
                    </div>
                    <div>
                        <img class="icon" src="./w_telegram.png" alt="" />
                        <span>triplefi</span>
                    </div>
                </div>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import Big from 'big.js'
import { formatMoney } from '@/utils/util'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import html2canvas from 'html2canvas'
import { postFile } from '@/api'
export default {
    name: 'Account',
    data() {
        return {
            showTab: false,
            showProfitCard: false,
            amount1: 0,
            amount2: 0,

            activeName: 'recharge'
        }
    },
    computed: {
        ...mapState(['coinbase', 'token0Balance', 'position', 'profitInfo', 'price', 'keepMarginScale', 'leverage']),
        ...mapGetters(['UsedMargin', 'NetValue', 'canUseMargin', 'LiquidationPrice', 'symbol']),
        precision() {
            return Math.abs(this.decimals) || 2
        },
        step() {
            return 1 / Math.pow(10, this.decimals) || 0.01
        },
        maxRecharge() {
            return Number(this.formatDecimals(this.token0Balance))
        },
        maxWithdraw() {
            if (this.NetValue - this.UsedMargin < 0) {
                return 0
            } else {
                return Number(this.formatDecimals(this.NetValue - this.UsedMargin))
            }
        },
        keepMargin(state) {
            if (JSON.stringify(state.position) !== '{}') {
                const { longPrice, longAmount, shortPrice, shortAmount } = state.position
                const keepMargin = (longAmount * longPrice + shortAmount * shortPrice) / this.keepMarginScale
                return keepMargin
            }
            return 0
        },
        liquidationStatus() {
            const value = /^MATIC/.test(this.symbol) ? 0.03 : 0.01
            if (this.LiquidationPrice > 0 && this.price) {
                if (Math.abs((this.price - this.LiquidationPrice) / this.price) < value) {
                    return 1
                }
                return 2
            } else {
                return 0
            }
        },
        shareStr() {
            const { pair, direction, closePrice, openPrice, R } = this.profitInfo || {}
            return `Brilliant! Congratulations to ${this.coinbase} on #TripleFi!
Rate of return: +${R}
Pair: ${pair}
Direction: ${direction == -2 ? 'Long' : 'Short'}
Open Price: ${formatMoney(this.pricePrecision(openPrice))}
Close Price: ${formatMoney(this.pricePrecision(closePrice))}
`
        },
        shareUrl() {
            const { imgUrl } = this.profitInfo || {}
            return `${imgUrl || ''} , https://triple.fi/`
        }
    },
    watch: {
        'profitInfo.transactionHash'(v) {
            if (v) {
                let audio = new Audio()
                audio.src = require('./video.mp3')
                audio.play()
                this.$nextTick(() => {
                    window.Sharer.init()
                })
                this.handleDownload(false)
            }
        }
    },
    methods: {
        ...mapMutations(['setProfitInfo']),
        ...mapActions(['rechargeMargin', 'withdrawMargin']),
        transfer() {
            this.showTab = true
        },
        handleMax() {
            if (this.activeName === 'recharge') {
                this.amount1 = this.maxRecharge
            } else {
                this.amount2 = this.maxWithdraw
            }
        },
        async handleRechargeMargin() {
            const bigAmount = Big(this.amount1).times(Math.pow(10, this.decimals))
            const params = {
                amount: this.toBN(bigAmount)
                // amount: this.toBN(this.amount1 * Math.pow(10, this.decimals))
            }
            console.log(params)
            this.showTab = false
            this.rechargeMargin(params)
                .then((res) => {
                    console.log(res)
                    this.amount1 = 0
                    this.delayRefreshData()
                })
                .catch((err) => {
                    console.error(err)
                })
        },
        async handleWithdrawMargin() {
            const bigAmount = Big(this.amount2).times(Math.pow(10, this.decimals))
            const params = {
                amount: this.toBN(bigAmount)
                // amount: this.toBN(this.amount2 * Math.pow(10, this.decimals))
            }
            console.log(params)
            this.showTab = false
            this.withdrawMargin(params)
                .then((res) => {
                    console.log(res)
                    this.amount2 = 0
                    this.delayRefreshData()
                })
                .catch((err) => {
                    console.error(err)
                })
        },
        handleCloseProfit() {
            this.setProfitInfo(null)
        },
        exchangeProfitInfo() {
            this.setProfitInfo({
                ...this.profitInfo,
                isShowR: !this.profitInfo.isShowR
            })
        },
        dataURLToBlob(dataurl) {
            let arr = dataurl.split(',')
            let mime = arr[0].match(/:(.*?);/)[1]
            let bstr = atob(arr[1])
            let n = bstr.length
            let u8arr = new Uint8Array(n)
            while (n--) {
                u8arr[n] = bstr.charCodeAt(n)
            }
            return new Blob([u8arr], { type: mime })
        },
        handleDownload(bool = true) {
            this.showProfitCard = true
            this.$nextTick(() => {
                html2canvas(document.getElementById('profit-card')).then((canvas) => {
                    let a = document.createElement('a')
                    let dom = document.body.appendChild(canvas)
                    dom.style.display = 'none'
                    a.style.display = 'none'
                    document.body.removeChild(dom)
                    let blob = this.dataURLToBlob(dom.toDataURL('image/png', 1))
                    if (bool) {
                        a.setAttribute('href', URL.createObjectURL(blob))
                        //这块是保存图片操作  可以设置保存的图片的信息
                        a.setAttribute('download', 'Profit.png')
                        document.body.appendChild(a)
                        a.click()
                        URL.revokeObjectURL(blob)
                        document.body.removeChild(a)
                    }
                    setTimeout(() => {
                        this.showProfitCard = false
                    }, 1000)
                    if (!this.profitInfo?.imgUrl) {
                        const file = new File([blob], 'Profit.png')
                        postFile(file).then((res) => {
                            this.setProfitInfo({
                                ...this.profitInfo,
                                imgUrl: `${window.location.origin}/share/${res.data}`
                            })
                        })
                    }
                })
            })
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
