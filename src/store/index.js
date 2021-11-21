import Vue from 'vue'
import Vuex from 'vuex'
import wallet from './wallet'
import contracts from './contracts'
import getters from './getters'
import { sortBy } from '@/utils/util'

Vue.use(Vuex)

const store = new Vuex.Store({
    state: {
        ready: false,

        wallet: '', // 钱包名称
        isMetaMask: false, // 是否安装MetaMask

        web3: null,
        provider: null,
        coinbase: '', // 账户地址
        balance: 0,
        chainId: '',
        networkId: '',

        pairInfo: {
            trade_coin: 'eth',
            margin_coin: 'usdt'
        },

        contract: null,
        contractAddress: '', // 合约地址
        amountDecimal: 0, // 合约数量精度
        decimals: 0, // token0 精度
        leverage: 1,
        poolNet: 0,
        feeRate: 1,
        divConst: 1,
        singleTradeLimitRate: 1,
        slideP: 0,
        fundingRate: 0,

        token0: null,
        token0Balance: 0,
        token0Address: '',
        token0Decimals: 0,
        allowance: 0,

        price: '', // indexPrice
        totalPool: '',
        position: {}, // 持仓
        trades: [], // 成交记录

        deadline: 2 * 60,
        tolerance: 0.5, // 滑点

        removeCoefficient: 0.99, // remove下单时的系数，增加下单成功率

        poolNetAmountRateLimitOpen: 0,
        poolNetAmountRateLimitPrice: 0,

        poolLongAmount: 0,
        poolShortAmount: 0
    },
    mutations: {
        setReady(state, payload) {
            state.ready = payload
        },
        setPairInfo(state, payload) {
            state.pairInfo = payload
        },
        setCoinbase(state, payload) {
            state.coinbase = payload
        },
        setWallet(state, payload) {
            state.wallet = payload
        },
        setMetaMask(state, payload) {
            state.isMetaMask = payload
        },
        setBalance(state, payload) {
            state.balance = payload
        },
        setChainId(state, payload) {
            state.chainId = payload
        },
        setNetworkId(state, payload) {
            state.networkId = payload
        },
        setWeb3(state, payload) {
            state.web3 = payload
        },
        setProvider(state, payload) {
            state.provider = payload
        },
        setContract(state, payload) {
            state.contract = payload
        },
        setToken0(state, payload) {
            state.token0 = payload
        },
        setToken0Balance(state, payload) {
            state.token0Balance = payload
        },
        setToken0Address(state, payload) {
            state.token0Address = payload
        },
        setToken0Decimals(state, payload) {
            state.token0Decimals = payload
        },
        setAllowance(state, payload) {
            state.allowance = payload
        },
        setContractAddress(state, payload) {
            state.contractAddress = payload
        },
        setDecimals(state, payload) {
            state.decimals = payload
        },
        setAmountDecimal(state, payload) {
            state.amountDecimal = payload
        },
        setLeverage(state, payload) {
            state.leverage = payload
        },
        setPoolNet(state, payload) {
            state.poolNet = payload
        },
        setFeeRate(state, payload) {
            state.feeRate = payload
        },
        setDivConst(state, payload) {
            state.divConst = payload
        },
        setSingleTradeLimitRate(state, payload) {
            state.singleTradeLimitRate = payload
        },
        setSlideP(state, payload) {
            state.slideP = payload
        },
        setFundingRate(state, payload) {
            state.fundingRate = payload
        },
        setDeadline(state, payload) {
            state.deadline = payload
        },
        setTolerance(state, payload) {
            state.tolerance = payload
        },
        setPosition(state, payload) {
            state.position = payload || {}
        },
        setTrade(state, payload) {
            const index = state.trades.findIndex((e) => e.transactionHash == payload.transactionHash)
            if (index < 0) {
                if (state.trades.length > 50) {
                    state.trades.pop()
                }
                state.trades.unshift(payload)
                state.trades.sort(sortBy('time', true, false))
            }
        },
        clearTrades(state) {
            state.trades = []
        },
        setPrice(state, payload) {
            state.price = payload
        },
        setTotalPool(state, payload) {
            state.totalPool = payload
        },
        setPoolNetAmountRateLimitOpen(state, payload) {
            state.poolNetAmountRateLimitOpen = payload
        },
        setPoolNetAmountRateLimitPrice(state, payload) {
            state.poolNetAmountRateLimitPrice = payload
        },
        setPoolLongAmount(state, payload) {
            state.poolLongAmount = payload
        },
        setPoolShortAmount(state, payload) {
            state.poolShortAmount = payload
        }
    },
    actions: {
        ...wallet,
        ...contracts
    },
    getters
})

export default store
