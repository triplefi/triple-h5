<template>
    <div class="page liquidity">
        <div class="main">
            <h6>Add Liquidity</h6>

            <div class="content-add">
                <div class="wrap">
                    <div class="flex flex-ac flex-bt">
                        <!-- <span v-if="token" class="fs14b token">{{ token }}</span> -->
                        <span class="fs14">Object</span>
                        <el-button v-if="!token" @click="selectToken" class="a-select" type="primary" round
                            >Select a token<i class="el-icon-arrow-down el-icon--right"></i
                        ></el-button>
                        <div v-else class="fs14b currency" @click="selectToken">
                            <img class="icon-coin" :src="token | getCoinIcon" alt="" />
                            <span>{{ token }}</span>
                            <i class="el-icon-arrow-down"></i>
                        </div>
                    </div>
                </div>
                <i class="el-icon-plus"></i>
                <div class="wrap">
                    <div class="flex flex-ac flex-bt">
                        <span class="fs14">Currency</span>
                        <el-button v-if="!currency" @click="selectCurrency" class="a-select" type="primary" round
                            >Select a currency<i class="el-icon-arrow-down el-icon--right"></i
                        ></el-button>
                        <div v-else class="fs14b currency" @click="selectCurrency">
                            <img class="icon-coin" src="@/assets/coin/coin_USDT.png" alt="" />
                            <span>{{ currency }}</span>
                            <i class="el-icon-arrow-down"></i>
                        </div>
                    </div>
                    <div style="height: 10px"></div>
                    <el-input-number
                        style="width: 100%"
                        v-model="amount"
                        :precision="precision"
                        :step="step"
                        :min="0"
                        :max="formatDecimals(token0BalanceOf) * 1"
                        placeholder="Enter an amount"
                    ></el-input-number>
                    <div style="height: 10px"></div>
                    <!-- @keyup="checkAdd" -->
                    <div class="flex available">
                        <span class="flex-1 fs14">Balance: {{ formatDecimals(token0BalanceOf) | formatMoney }}</span>
                        <span class="fs14b max" @click="handleMax()">Max</span>
                    </div>
                </div>
                <div class="flex flex-ac">
                    <el-button
                        v-if="!allowance"
                        class="btn-enter"
                        type="primary"
                        round
                        @click="handleApprove"
                        :disabled="!coinbase"
                        >Approve</el-button
                    >
                    <el-button class="btn-enter" type="primary" round @click="handleAddLiquidity" :disabled="!allowance"
                        >Supply</el-button
                    >
                </div>
            </div>

            <el-dialog title="Select a token" :visible.sync="selectModel" :close-on-click-modal="false" width="375px">
                <div class="content-select">
                    <el-input
                        class="serach-input"
                        v-model="search"
                        @input="handleSearch"
                        placeholder="Search name or paste address"
                    ></el-input>
                    <!-- <div class="flex flex-ac">
            <span class="fs14 label">Slippage tolerance</span>
            <el-tooltip
              effect="dark"
              content="Text Demo - Your transaction will revert if the price changes unfavorably by more than this percentage."
              placement="top"
            >
              <svg-icon
                icon-class="ic_16qs"
                class-name="s16 icon-question"
              ></svg-icon>
            </el-tooltip>
          </div> -->
                    <!-- <div class="currencys">
            <div
              class="fs14 currency"
              v-for="item in currencys"
              :key="item"
              @click="checkCoin(item)"
            >
              <img class="icon" src="@/assets/coin/coin_ETH.png" alt="" />
              <span>{{ item }}</span>
            </div>
          </div> -->
                    <div class="line"></div>
                    <div class="curreny-list">
                        <template v-if="currencys.length">
                            <div class="curreny-item" v-for="item in showList" :key="item" @click="checkCoin(item)">
                                <img class="icon" :src="item | getCoinIcon" alt="" />
                                <div>
                                    <div class="fs14 code">{{ item }}</div>
                                    <div class="fs12 name">{{ item.toLowerCase() }}</div>
                                </div>
                                <div class="fs16 value"></div>
                            </div>
                        </template>
                        <div class="fs16 no-data" v-else>No results found.</div>
                    </div>
                </div>
            </el-dialog>
        </div>
    </div>
</template>

<script>
import Big from 'big.js'
import { bus } from '@/utils/bus'
import { formatNum } from '@/utils/util'
import abi from '@/contracts/HedgexSingle.json'
import erc20abi from '@/contracts/TokenERC20.json' // 标准ERC20代币ABI
import { getTradePairs } from '@/api'
export default {
    name: 'PoolAdd',
    data() {
        return {
            activeName: '',
            list: [
                // {
                //   token: "eth",
                //   currency: "usdt"
                // }
            ],
            curPair: {},

            addModel: false,
            addLoading: false,
            token: '',
            currency: '',
            amount: 0,

            selectType: '',
            selectModel: false,
            search: '',
            currencys: ['USDT'],
            // currencys: ["ETH", "USDC", "USDT", "DAI"], // 本位币
            // currencys: ["ETH", "UNI", "COMP", "MKR", "LINK", "BTT"], // LP
            showList: [],

            pcontract: null,
            ptoken0: null,

            // 1: balanceOf用来获取用户lp量，totalSupply用来获取lp总量，totalPool用来获取对冲池总价值。
            // 对于流动性提供者，用这几个量进行计算就行。
            loading: false,
            name: '',
            symbol: '',
            balanceOf: 0,
            token0BalanceOf: 0,
            token0Decimals: 0,

            approve: '0xfffffffffffffffffffffffffffffffe',
            allowance: 0
        }
    },
    computed: {
        precision() {
            return Math.abs(this.token0Decimals) || 2
        },
        step() {
            return 1 / Math.pow(10, this.token0Decimals) || 0.01
        },
        pair() {
            return (this.token + '/' + this.currency).toLowerCase()
        }
    },
    watch: {
        selectModel(n) {
            if (!n) {
                this.search = ''
            }
        },
        addModel(n) {
            if (!n) {
                this.token = ''
                this.currency = 'USDT'
                this.amount = 0
            }
        },
        list(n) {
            n && this.checkCanFatch()
        },
        pair(n) {
            n && this.checkCanFatch()
        },
        coinbase(n) {
            n && this.checkCanFatch()
        }
        // 交易对改变，合约改变
    },
    created() {
        const { token, currency } = this.$route.params
        this.token = token ? token.toUpperCase() : ''
        this.currency = currency ? currency.toUpperCase() : ''

        this.getPairsInfo()
        bus.$on('accountsChanged', () => {
            this.getPairsInfo()
        })
    },
    beforeUpdate() {
        const { token, currency } = this.$route.params
        this.token = token ? token.toUpperCase() : ''
        this.currency = currency ? currency.toUpperCase() : ''
    },
    beforeDestroy() {
        bus.$off('accountsChanged')
    },
    methods: {
        formatDecimals(val) {
            // 合约换算和精度
            return formatNum(val / Math.pow(10, this.token0Decimals), this.token0Decimals * 1)
        },
        async getPairsInfo() {
            try {
                const res = await getTradePairs()
                if (res.result) {
                    this.list = res.data.map((item) => {
                        return {
                            token: item.trade_coin,
                            currency: item.margin_coin,
                            contractAddress: item.contract
                        }
                    })
                }
            } catch (error) {
                console.log(error)
                this.getPairsInfo()
            }
        },
        handleChange(i) {
            if (typeof i == 'number') {
                this.curPair = this.list[i]
            }
        },
        checkCanFatch() {
            console.log('checkCanFatch')
            const l = this.pair.split('/')
            if (this.coinbase && l[0] && l[1] && this.list.length) {
                const p = this.list.filter((item) => {
                    return item.token == l[0] && item.currency == l[1]
                })
                if (p[0]) {
                    this.curPair = p[0]
                    this.getContractInfo()
                }
            }
        },
        async getContractInfo() {
            console.log('getContractInfo', this.curPair)
            try {
                this.loading = true
                this.pcontract = new this.web3.eth.Contract(abi, this.curPair.contractAddress)
                const token0Address = await this.pcontract.methods.token0().call()
                this.ptoken0 = new this.web3.eth.Contract(erc20abi, token0Address) // 生成token0合约对象
                // this.name = await this.pcontract.methods.name().call();
                // this.symbol = await this.pcontract.methods.symbol().call();
                const [balanceOf, token0BalanceOf, token0Decimals] = await Promise.all([
                    this.pcontract.methods.balanceOf(this.coinbase).call(),
                    this.ptoken0.methods.balanceOf(this.coinbase).call(),
                    this.ptoken0.methods.decimals().call()
                ])
                this.balanceOf = balanceOf * 1
                this.token0BalanceOf = token0BalanceOf * 1
                this.token0Decimals = token0Decimals * 1
                this.handleAllowance()
                this.loading = false
            } catch (error) {
                this.loading = false
                console.log(error)
            }
        },
        add(item) {
            this.addModel = true
            this.token = item.token.toUpperCase()
            this.currency = item.currency.toUpperCase()
            this.amount = 0
        },
        selectToken() {
            this.selectType = 'token'
            this.currencys = this.list.map((item) => item.token.toUpperCase())
            this.showList = this.currencys
            this.selectModel = true
        },
        selectCurrency() {
            this.selectType = 'currency'
            this.currencys = ['USDT']
            this.showList = this.currencys
            this.selectModel = true
        },
        checkCoin(val) {
            if (this.selectType === 'token') {
                if (this.token != val) {
                    this.token = val
                    this.$router.push(`/pool/add/${this.currency.toLowerCase()}/${val.toLowerCase()}`)
                }
            } else if (this.selectType === 'currency') {
                if (this.currency != val) {
                    this.currency = val
                    this.$router.push(
                        this.token
                            ? `/pool/add/${val.toLowerCase()}/${this.token.toLowerCase()}`
                            : `/pool/add/${val.toLowerCase()}`
                    )
                }
            }
            this.selectModel = false
        },
        handleSearch(e) {
            let reg = `${e}`
            let Reg = new RegExp(reg, 'i')

            this.showList = this.currencys.filter((item) => {
                return item.match(Reg)
            })
        },
        // approve
        async handleApprove() {
            const bol = await this.ptoken0.methods
                .approve(this.curPair.contractAddress, this.toBN(this.approve)) // 允许合约消费限额
                .send({ from: this.coinbase })
            console.log('approve', bol)
            this.handleAllowance()
            this.$message({
                type: 'success',
                message: 'Approve Succeeded'
            })
        },
        async handleAllowance() {
            const allowance = await this.ptoken0.methods
                .allowance(this.coinbase, this.curPair.contractAddress) // 查询账户允许合约的消费限额
                .call()
            this.allowance = allowance / Math.pow(10, this.token0Decimals)
        },
        // add
        handleMax() {
            if (this.allowance) {
                this.amount = this.formatDecimals(Math.min(this.allowance, this.token0BalanceOf))
            } else {
                this.amount = this.formatDecimals(this.token0BalanceOf)
            }
        },
        async handleAddLiquidity() {
            if (!this.amount || parseFloat(this.amount) === 0) {
                this.$message({
                    type: 'error',
                    message: 'Please enter an amount.'
                })
                return
            }
            this.addLoading = true
            const bigAmount = Big(this.amount).times(Math.pow(10, this.token0Decimals))
            const params = {
                amount: this.toBN(bigAmount),
                // amount: this.toBN(this.amount * Math.pow(10, this.token0Decimals)),
                to: this.coinbase
            }
            console.log(params)
            try {
                const res = await this.pcontract.methods
                    .addLiquidity(params.amount, params.to)
                    .send({ from: this.coinbase })
                console.log('addLiquidity', res)
                this.addModel = false
                this.getContractInfo()
            } catch (error) {
                console.log(error)
            }
            this.addLoading = false
        }
    }
}
</script>

<style lang="scss" scoped>
@import './index.scss';
</style>
