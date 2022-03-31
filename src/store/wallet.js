import Web3 from 'web3'
import WalletConnectProvider from '@walletconnect/web3-provider'
import abi from '@/contracts/HedgexSingle.json'
import erc20abi from '@/contracts/TokenERC20.json' // 标准ERC20代币ABI
import { Message } from 'element-ui'
import { bus } from '@/utils/bus'
import { checkMatic, getNetConfig, checkSupportChain } from '@/utils/util'
import { getTradePairs, getContractTrades, getContractCons, getContractExplosive } from '@/api'
let poolInterval = null
let pairTimeHandler = null
let positioTimeHandler = null
export default {
    // Login, getProvider
    // 选择MetaMask钱包
    async metaMaskInit({ state, commit, dispatch }) {
        console.log('metaMaskInit')
        if (typeof window.ethereum !== 'undefined') {
            commit('setMetaMask', true)
            try {
                const provider = window.ethereum
                commit('setProvider', provider)
                localStorage.setItem('wallet', 'MetaMask')
                commit('setWallet', 'MetaMask')
                dispatch('providerEvents')
                // 请求用户账号授权
                provider.enable().catch(async (err) => {
                    if (window.location.pathname !== '/') {
                        Message({
                            type: 'error',
                            message: 'User denied account access'
                        })
                        if (err.code == '-32002') {
                            let chainId = getNetConfig()[0].id
                            chainId = '0x' + parseInt(chainId).toString(16)
                            console.log(chainId, '=====')
                            provider
                                .request({
                                    method: 'wallet_switchEthereumChain',
                                    params: [{ chainId }]
                                })
                                .catch((err) => {
                                    console.log(err)
                                })
                        }
                    }
                })
                return dispatch('initWeb3')
            } catch (error) {
                return Promise.reject()
            }
        } else {
            commit('setMetaMask', false)
            Message({
                type: 'error',
                message: 'Please install MetaMask',
                duration: 3000
            })
            return Promise.reject()
        }
    },
    // 选择WalletConnect钱包
    // https://docs.walletconnect.org/quick-start/dapps/web3-provider
    async walletConnectInit({ commit, dispatch }) {
        console.log('walletConnectInit')
        try {
            //  Create WalletConnect Provider
            const provider = new WalletConnectProvider({
                infuraId: '409cb990eed2482eb12ff3e42320312a'
            })
            //  Enable session (triggers QR Code modal)
            await provider.enable()
            await commit('setWallet', 'WalletConnect')
            localStorage.setItem('wallet', 'WalletConnect')
            commit('setProvider', provider)
            dispatch('providerEvents')
            return dispatch('initWeb3')
        } catch (error) {
            return Promise.reject()
        }
    },
    // 断开WalletConnect钱包
    disconnect({ state, commit }) {
        // Close provider session  仅 WalletConnect 可用
        if (state.wallet === 'WalletConnect') {
            state.provider.disconnect()
            commit('setWallet', '')
        }
    },
    // 监听 provider events
    // https://docs.metamask.io/guide/ethereum-provider.html#events
    providerEvents({ state, dispatch }) {
        // Subscribe Events
        if (window.isAddProviderEvents) {
            return
        }
        window.isAddProviderEvents = true
        state.provider.on('accountsChanged', async (accounts) => {
            console.log('accountsChanged', accounts)
            try {
                dispatch('resetApp')
                // await dispatch('metaMaskInit')
                const wallet = localStorage.getItem('wallet')
                if (wallet === 'MetaMask') {
                    await dispatch('metaMaskInit')
                } else if (wallet === 'WalletConnect') {
                    await dispatch('walletConnectInit')
                }
                // await dispatch('initWeb3')
                await dispatch('getPairsList')
                await dispatch('initContract', { notFirst: true, pairInfo: state.pairInfo })
                bus.$emit('accountsChanged')
            } catch (error) {
                console.log(error)
            }
        })
        state.provider.on('chainChanged', (chainId) => {
            console.log('chainChanged', parseInt(chainId, 10))
            window.localStorage.setItem('curChainId', parseInt(chainId, 10))
            window.location.reload()
        })
        state.provider.on('disconnect', (code, reason) => {
            console.log('disconnect', code, reason)
            // dispatch('resetApp')
        })
    },
    // MetaMask 登录后不可退出
    // WalletConncet 登录后可退出 （Math, Trust, ...）
    // 多个WalletConnect 账户登录后，切换 MetaMask 无效，除非 WalletConnect 退出到只剩一个
    // MathWallet 插件开启后，比 MetaMask 更优先

    async initWeb3({ state, commit, dispatch }) {
        try {
            // web3
            console.time('initWeb3')
            const web3 = new Web3(state.provider)
            commit('setWeb3', web3)
            const chainId = await web3.eth.getChainId()
            commit('setChainId', chainId)
            window.localStorage.setItem('curChainId', chainId)
            const coinbase = await web3.eth.getCoinbase() // 链接的账户
            web3.eth.defaultAccount = coinbase
            commit('setCoinbase', coinbase)
            await dispatch('getPairsList')
            if (coinbase) {
                web3.eth.getBalance(coinbase).then((res) => {
                    let balance = web3.utils.fromWei(res, 'ether')
                    commit('setBalance', balance * 1)
                })
                // balance = await web3.eth.getBalance(coinbase) // 账户余额
                // balance = web3.utils.fromWei(balance, 'ether')
            } else {
                const isUnlocked = await state.provider._metamask.isUnlocked()
                if (isUnlocked) {
                    Message({
                        type: 'success',
                        message: 'No account connected'
                    })
                }
            }

            // const networkId = await web3.eth.net.getId()
            // console.log(networkId, '-----')
            // const blockNumber = await web3.eth.getBlockNumber();

            // 开启pool池数据拉取
            if (poolInterval) {
                clearInterval(poolInterval)
            }
            poolInterval = setInterval(() => {
                dispatch('getPoolData')
            }, 3000)
            // commit("setChainId", chainId);
            // commit("setNetworkId", networkId);
            // console.log("blockNumber", blockNumber);

            // // 订阅
            // web3.eth.clearSubscriptions()

            // const subscription = web3.eth.subscribe('logs', function (error, result) {
            //   if (!error)
            //     console.log(result);
            // })
            //   .on("connected", function (subscriptionId) {
            //     console.log('connected', subscriptionId);
            //   })
            //   .on("data", function (log) {
            //     console.log('data', log);
            //   })
            //   .on("changed", function (log) {
            //     console.log('changed', log);
            //   });
            // // 取消订阅
            // subscription.unsubscribe(function (error, success) {
            //   if (success)
            //     console.log('Successfully unsubscribed!');
            // });
            console.timeEnd('initWeb3')
            return Promise.resolve()
        } catch (error) {
            Message({
                type: 'error',
                message: error.message,
                duration: 3000
            })
            return Promise.reject()
        }
    },
    async initContract({ state, commit, dispatch }, payload = {}) {
        try {
            console.time('initContract')
            const isUnlocked = await state.provider._metamask.isUnlocked()
            if (!isUnlocked) {
                return
            }
            commit('setReady', false)
            commit('clearTrades')
            let { notFirst, pairInfo } = payload
            console.log('pairInfo', pairInfo)
            pairInfo = pairInfo || {}
            // commit('setPairInfo', pairInfo)

            // contract
            // const contractAddress = '0xB21ceaec9B2259F28e839c87F8AeE35f835F3C7D'; // 合约地址
            const contractAddress = pairInfo.contract
            if (!contractAddress) {
                return
            }

            // 获取合约常量
            const divConst = 1000000
            const constRes = await getContractCons(contractAddress)
            const {
                fee_rate,
                keep_margin_scale,
                leverage,
                min_amount,
                r_open,
                r_price,
                single_close_limit_rate,
                single_open_limit_rate,
                token0,
                token0_decimal
            } = constRes.data

            // commit('setContractAddress', contractAddress)
            console.log('contractAddress=', contractAddress)
            const contract = new state.web3.eth.Contract(abi, contractAddress)
            const amountDecimal = Math.log10(min_amount)
            const decimals = Math.log10(token0_decimal)
            commit('setContract', contract)
            commit('setAmountDecimal', amountDecimal)
            commit('setDecimals', decimals)
            commit('setKeepMarginScale', keep_margin_scale)
            commit('setLeverage', leverage)
            commit('setFeeRate', fee_rate * divConst)
            commit('setDivConst', divConst)
            commit('setSingleCloseLimitRate', single_close_limit_rate * divConst)
            commit('setSingleOpenLimitRate', single_open_limit_rate * divConst)
            commit('setPoolNetAmountRateLimitOpen', r_open * divConst)
            commit('setPoolNetAmountRateLimitPrice', r_price * divConst)
            // token0
            const token0Contract = new state.web3.eth.Contract(erc20abi, token0) // 生成token0合约对象
            commit('setToken0', token0Contract)
            commit('setToken0Address', token0)
            commit('setToken0Decimals', decimals)
            commit('setReady', true)

            if (!notFirst) {
                // networkId首次连接监听事件，只切换账户不需要（会重复监听）
                dispatch('contractEvents')
            }
            console.timeEnd('initContract')
            commit('setNetworkError', false)

            if (state.coinbase) {
                dispatch('refreshData')
                const allowance = await token0Contract.methods.allowance(state.coinbase, contractAddress).call() // 查询账户允许合约的消费限额
                commit('setAllowance', allowance / Math.pow(10, decimals))
            }
        } catch (error) {
            if (state.chainId && !checkSupportChain(state.chainId)) {
                commit('setNetworkError', true)
            }
        }
    },
    async contractEvents({ state, commit }) {
        // 订阅合约 events
        console.log('contractEvents')
        commit('clearTrades')
        let toBlock = await state.web3.eth.getBlockNumber()
        // const limit = checkMatic(state.chainId) ? 1000 : 10000
        const limit = 10
        const getFromBlock = (to) => {
            return to - limit > 0 ? to - limit : 0
        }
        const changeTradesList = async (list) => {
            const requestList = await Promise.all(list.map((e) => state.web3.eth.getBlock(e.blockNumber)))
            list.forEach((item, i) => {
                item.time = requestList[i].timestamp * 1000
                commit('setTrade', item)
            })
        }
        // matic网络，轮询获取trades
        const getPastEvents = (from, to, key = 'Trade', contractAddress = '') => {
            state.contract.getPastEvents(
                key,
                {
                    fromBlock: from,
                    toBlock: to
                },
                (err, event) => {
                    if (err) {
                        console.log(err)
                    } else {
                        if (event.length) {
                            const _list = event.map((item) => {
                                const { amount, direction, price } = item.returnValues
                                return {
                                    amount,
                                    direction,
                                    price,
                                    blockNumber: item.blockNumber,
                                    transactionHash: item.transactionHash
                                }
                            })
                            changeTradesList(_list)
                        }
                    }
                }
            )
        }
        // 获取历史交易数据，包括爆仓
        const getAllPaseEvents = (from, to) => {
            getPastEvents(from, to, 'Trade', state.contractAddress)
            getPastEvents(from, to, 'Explosive', state.contractAddress)
        }
        // 首次获取历史数据，截止获取到50条，2022-03-03修改为通过接口获取
        // getAllPaseEvents(fromBlock, toBlock, true, 'Trade')
        Promise.all([getContractTrades(state.contractAddress), getContractExplosive(state.contractAddress)])
            .then((res) => {
                const resList = [...(res[0].data || []), ...(res[1].data || [])]
                const list = resList.map((e) => {
                    const { amount, direction, price, block, tx } = e
                    return {
                        amount,
                        direction,
                        price,
                        blockNumber: block,
                        transactionHash: tx
                    }
                })
                changeTradesList(list)
            })
            .catch((err) => {
                console.log(err)
            })

        // matic无法收到trade消息，只能通过轮询获取trade信息
        if (checkMatic(state.chainId)) {
            if (window.getTradeHandler) {
                clearInterval(window.getTradeHandler)
            }
            window.getTradeHandler = setInterval(async () => {
                const latest = await state.web3.eth.getBlockNumber()
                getAllPaseEvents(getFromBlock(latest), latest, false)
            }, 2000)
        }
        const addTradeListener = (key) => {
            state.contract.events[key](
                {
                    fromBlock: toBlock
                    // fromBlock: 0,
                    // toBlock: 'latest'
                },
                async (err, event) => {
                    if (err) {
                        console.log(err)
                    } else {
                        console.log('event', event.event, event)
                        if (event.event === key) {
                            const { amount, direction, price } = event.returnValues
                            const block = await state.web3.eth.getBlock(event.blockNumber)
                            commit('setTrade', {
                                amount,
                                direction,
                                price,
                                time: block.timestamp * 1000,
                                blockNumber: event.blockNumber,
                                transactionHash: event.transactionHash
                            })
                        }
                    }
                }
            )
        }
        addTradeListener('Trade')
        addTradeListener('Explosive')
    },
    // 获取持仓
    async getPosition({ state, commit, dispatch }) {
        const position = await state.contract.methods.traders(state.coinbase).call()
        const { longAmount, longPrice, margin, shortAmount, shortPrice } = position
        const newPosition = {
            longAmount: longAmount * 1,
            longPrice: longPrice * 1,
            margin: margin * 1,
            shortAmount: shortAmount * 1,
            shortPrice: shortPrice * 1
        }
        if (JSON.stringify(newPosition) !== JSON.stringify(state.position)) {
            commit('setPosition', newPosition)
            dispatch('getPoolData')
            // 发生交易时更新持仓
            bus.$emit('updateUserPosition')
        }
    },
    // 更新数据
    async refreshData({ state, commit, dispatch }) {
        const request = async () => {
            let balance = await state.web3.eth.getBalance(state.coinbase)
            balance = state.web3.utils.fromWei(balance, 'ether')
            commit('setBalance', balance * 1)
            const token0Balance = await state.token0.methods.balanceOf(state.coinbase).call()
            commit('setToken0Balance', token0Balance * 1)
            dispatch('getPosition')
            clearTimeout(positioTimeHandler)
            positioTimeHandler = setTimeout(request, 5000)
        }
        request()
    },
    // 获取pool动态数据
    async getPoolData({ state, commit }) {
        if (!state.contract) {
            return
        }
        try {
            const res = await Promise.all([
                state.contract.methods.poolLongPrice().call(),
                state.contract.methods.poolShortPrice().call(),
                state.contract.methods.totalPool().call(),
                state.contract.methods.poolLongAmount().call(),
                state.contract.methods.poolShortAmount().call(),
                state.contract.methods.getLatestPrice().call(),
                state.contract.methods.dailyInterestRateBase().call(),
                state.contract.methods.poolState().call()
            ])
            const poolLongPrice = res[0] * 1
            const poolShortPrice = res[1] * 1
            const totalPool = res[2] * 1
            const poolLongAmount = res[3] * 1
            const poolShortAmount = res[4] * 1
            const price = res[5][0] * 1
            const excursionUp = res[5][1] * 1 || 0
            const excursionDown = res[5][2] * 1 || 0
            const poolState = res[7] * 1
            commit('setPoolLongPrice', poolLongPrice)
            commit('setPoolShortPrice', poolShortPrice)
            commit('setTotalPool', totalPool)
            commit('setPoolLongAmount', poolLongAmount)
            commit('setPoolShortAmount', poolShortAmount)
            commit('setPriceExcursionUp', excursionUp)
            commit('setPriceExcursionDown', excursionDown)
            commit('setPrice', price)
            commit('setPoolState', poolState)
            let poolNet = totalPool
            if (poolState !== 2) {
                poolNet =
                    totalPool +
                    (poolLongAmount * price + poolShortAmount * poolShortPrice) -
                    (poolLongAmount * poolLongPrice + poolShortAmount * price)
            }
            commit('setPoolNet', poolNet)

            // 计算fundingRate
            const dailyInterestRateBase = res[6] * 1
            const divConst = state.divConst
            if (divConst) {
                const r0 = dailyInterestRateBase / divConst
                let fundingRate
                if (poolLongAmount * 1 > poolShortAmount * 1) {
                    fundingRate = (-r0 * (poolLongAmount - poolShortAmount)) / poolLongAmount
                } else if (poolShortAmount * 1 > poolLongAmount * 1) {
                    fundingRate = (r0 * (poolShortAmount - poolLongAmount)) / poolShortAmount
                } else {
                    fundingRate = 0
                }
                commit('setFundingRate', fundingRate * 1)
            }
        } catch (error) {
            console.log(error)
        }
    },
    // 获取交易对
    async getPairsList({ commit, dispatch }, params) {
        try {
            const res = await getTradePairs()
            let list = res.result ? res.data : []
            const sortList = ['quick', 'bct', 'btc', 'iota', 'matic', 'eth']
            let newList = []
            sortList.forEach((d) => {
                const item = list.find((e) => e.trade_coin === d)
                if (item) {
                    newList.push(item)
                }
            })
            newList = [...newList, ...list.filter((e) => !sortList.includes(e.trade_coin))]
            if (!params?.noSetPairInfo) {
                let pairInfo = {}
                try {
                    pairInfo = window.localStorage.getItem('curPairInfo')
                    pairInfo = JSON.parse(pairInfo) || {}
                } catch (error) {
                    pairInfo = {}
                }
                const findInfo = newList.find((e) => e.trade_coin === pairInfo.trade_coin)
                pairInfo = findInfo || newList[0] || {}
                dispatch('setPairCoin', pairInfo)
            }
            commit('setPairList', newList)
            clearTimeout(pairTimeHandler)
            pairTimeHandler = setTimeout(() => {
                dispatch('getPairsList', { noSetPairInfo: true })
            }, 3000)
        } catch (error) {
            console.log(error)
            dispatch('getPairsList')
        }
    },
    // 设置交易对
    async setPairCoin({ commit, dispatch }, info) {
        window.localStorage.setItem('curPairInfo', JSON.stringify(info))
        commit('setPairInfo', info)
        dispatch('resetPair')
        dispatch('initContract', { pairInfo: info })
        commit('setContractAddress', info.contract)
    },
    // getFundingRate
    // async getFundingRate({ state, commit }) {
    //     const [dailyInterestRateBase, divConst, poolLongAmount, poolShortAmount] = await Promise.all([
    //         state.contract.methods.dailyInterestRateBase().call(),
    //         state.contract.methods.divConst().call(),
    //         state.contract.methods.poolLongAmount().call(),
    //         state.contract.methods.poolShortAmount().call()
    //     ])
    //     const r0 = dailyInterestRateBase / divConst
    //     let fundingRate
    //     if (poolLongAmount * 1 > poolShortAmount * 1) {
    //         fundingRate = (-r0 * (poolLongAmount - poolShortAmount)) / poolLongAmount
    //     } else if (poolShortAmount * 1 > poolLongAmount * 1) {
    //         fundingRate = (r0 * (poolShortAmount - poolLongAmount)) / poolShortAmount
    //     } else {
    //         fundingRate = 0
    //     }
    //     commit('setFundingRate', fundingRate * 1)
    // },
    // async providerRequest({ state }, payload) {
    //   // const payload = {
    //   //   method: string;
    //   //   params?: unknown[] | object;
    //   // }
    //   // Send JSON RPC requests
    //   const result = await state.provider.request(payload)
    //   console.log(result)
    //   return result
    // },
    // async getParams() {
    //   const accounts = await this.web3.eth.getAccounts();
    //   const chainId = await this.web3.eth.getChainId();
    //   const networkId = await this.web3.eth.net.getId();
    //   const txHash = await this.web3.eth.sendTransaction(tx);
    //   const signedTx = await this.web3.eth.signTransaction(tx);
    //   const signedMessage = await this.web3.eth.sign(msg);
    //   const signedTypedData = await this.web3.eth.signTypedData(msg);
    // },
    resetApp({ commit, dispatch }) {
        commit('setWeb3', null)
        commit('setProvider', null)
        commit('setContract', null)
        commit('setCoinbase', '')
        commit('setBalance', 0)

        dispatch('resetPair')
    },
    resetPair({ commit }) {
        commit('setPosition', {})
        commit('setPrice', 0)
        commit('setPriceExcursionUp', 0)
        commit('setPriceExcursionDown', 0)
        commit('setPoolLongPrice', 0)
        commit('setPoolShortPrice', 0)
        commit('setTotalPool', 0)
        commit('setPoolLongAmount', 0)
        commit('setPoolShortAmount', 0)
        commit('setPoolNet', 0)
        commit('clearTrades')
        if (window.getTradeHandler) {
            clearInterval(window.getTradeHandler)
        }
    }
}
