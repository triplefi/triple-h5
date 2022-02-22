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
        singleCloseLimitRate: 1,
        singleOpenLimitRate: 1,
        fundingRate: 0,

        token0: null,
        token0Balance: 0,
        token0Address: '',
        token0Decimals: 0,
        allowance: 0,

        price: '', // indexPrice
        priceExcursion: '', // 价格偏移
        totalPool: '',
        position: {}, // 持仓
        trades: [], // 成交记录

        poolState: 1,

        deadline: 2 * 60,
        tolerance: 0.5, // 滑点

        removeCoefficient: 0.99, // remove下单时的系数，增加下单成功率

        poolNetAmountRateLimitOpen: 0,
        poolNetAmountRateLimitPrice: 0,

        poolLongAmount: 0,
        poolShortAmount: 0,
        poolLongPrice: 0,
        poolShortPrice: 0,

        limitCoefficient: 0.99,

        isNetworkError: false,
        pairList: [],
        profitInfo: null, // 收益，当有收益时显示

        keepMarginScale: 30 //维持保证金计算比例
    },
    mutations: {
        setReady(state, payload) {
            state.ready = payload
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
        setSingleOpenLimitRate(state, payload) {
            state.singleOpenLimitRate = payload
        },
        setSingleCloseLimitRate(state, payload) {
            state.singleCloseLimitRate = payload
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
        // push最新的trade数据进入，去重，排序
        setTrade(state, payload) {
            const index = state.trades.findIndex((e) => e.transactionHash == payload.transactionHash)
            if (index < 0) {
                state.trades.unshift(payload)
                state.trades.sort(sortBy('time', true, false))
                if (state.trades.length > 30) {
                    state.trades.pop()
                }
            }
        },
        clearTrades(state) {
            state.trades = []
        },
        setPrice(state, payload) {
            state.price = payload
        },
        setPriceExcursion(state, payload) {
            state.priceExcursion = payload
        },
        setPoolState(state, payload) {
            state.poolState = payload
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
        },
        setPoolLongPrice(state, payload) {
            state.poolLongPrice = payload
        },
        setPoolShortPrice(state, payload) {
            state.poolShortPrice = payload
        },
        setNetworkError(state, payload) {
            state.isNetworkError = payload
        },
        setPairList(state, payload) {
            state.pairList = payload || []
        },
        setPairInfo(state, payload) {
            state.pairInfo = payload
        },
        setProfitInfo(state, payload) {
            state.profitInfo = payload
        },
        setKeepMarginScale(state, payload) {
            state.keepMarginScale = payload
        }
    },
    actions: {
        ...wallet,
        ...contracts
    },
    getters
})

export default store
