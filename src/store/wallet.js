import Web3 from 'web3'
import WalletConnectProvider from '@walletconnect/web3-provider'
import abi from '@/contracts/HedgexSingle.json'
import erc20abi from '@/contracts/TokenERC20.json' // 标准ERC20代币ABI
import { Message } from 'element-ui'
import { bus } from '@/utils/bus'
let poolInterval = null
export default {
    // Login, getProvider
    // 选择MetaMask钱包
    async metaMaskInit({ commit, dispatch }) {
        console.log('metaMaskInit')
        if (typeof window.ethereum !== 'undefined') {
            commit('setMetaMask', true)
            try {
                const provider = window.ethereum
                await provider.enable() // 请求用户账号授权
                await commit('setWallet', 'MetaMask')
                localStorage.setItem('wallet', 'MetaMask')
                commit('setProvider', provider)
                dispatch('providerEvents')
                return dispatch('initWeb3')
            } catch (error) {
                Message({
                    type: 'error',
                    message: 'User denied account access'
                })
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
            console.log(error.message)
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
                await dispatch('initContract', { notFirst: true, pairInfo: state.pairInfo })
                bus.$emit('accountsChanged')
            } catch (error) {
                console.log(error)
            }
        })
        state.provider.on('chainChanged', (chainId) => {
            console.log('chainChanged', chainId)
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
            const web3 = new Web3(state.provider)
            const coinbase = await web3.eth.getCoinbase() // 链接的账户
            let balance
            if (coinbase) {
                balance = await web3.eth.getBalance(coinbase) // 账户余额
                balance = web3.utils.fromWei(balance, 'ether')
            } else {
                Message({
                    type: 'success',
                    message: 'No account connected'
                })
            }
            web3.eth.defaultAccount = coinbase
            // const chainId = await web3.eth.getChainId();
            // const networkId = await web3.eth.net.getId();
            // const blockNumber = await web3.eth.getBlockNumber();

            commit('setWeb3', web3)
            commit('setCoinbase', coinbase)
            commit('setBalance', balance * 1)

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

        // commit('setContractAddress', contractAddress)
        const contract = new state.web3.eth.Contract(abi, contractAddress)
        const amountDecimal = await contract.methods.amountDecimal().call()
        const decimals = await contract.methods.decimals().call()
        commit('setContract', contract)
        commit('setAmountDecimal', amountDecimal * 1)
        commit('setDecimals', decimals * 1)
        commit('setReady', true)

        const constantRes = await Promise.all([
            contract.methods.leverage().call(),
            contract.methods.feeRate().call(),
            contract.methods.divConst().call(),
            contract.methods.slideP().call(),
            contract.methods.singleCloseLimitRate().call(),
            contract.methods.singleOpenLimitRate().call(),
            contract.methods.poolNetAmountRateLimitOpen().call(),
            contract.methods.poolNetAmountRateLimitPrice().call(),
            contract.methods.token0().call()
        ])
        commit('setLeverage', constantRes[0] * 1)
        commit('setFeeRate', constantRes[1] * 1)
        commit('setDivConst', constantRes[2] * 1)
        commit('setSlideP', constantRes[3] * 1)
        commit('setSingleCloseLimitRate', constantRes[4] * 1)
        commit('setSingleOpenLimitRate', constantRes[5] * 1)
        commit('setPoolNetAmountRateLimitOpen', constantRes[6] * 1)
        commit('setPoolNetAmountRateLimitPrice', constantRes[7] * 1)

        // token0
        const token0Address = constantRes[8] // 获取token0address
        console.log(token0Address, '000000000')
        // const token0Address = pairInfo.margin_address // 获取token0address
        const token0 = new state.web3.eth.Contract(erc20abi, token0Address) // 生成token0合约对象
        const token0Decimals = await token0.methods.decimals().call() // token0精度
        commit('setToken0', token0)
        commit('setToken0Address', token0Address)
        commit('setToken0Decimals', token0Decimals * 1)

        if (state.coinbase) {
            dispatch('getPosition')
            // dispatch('getFundingRate')
            const token0Balance = await token0.methods.balanceOf(state.coinbase).call() // 用户lp数量
            const allowance = await token0.methods.allowance(state.coinbase, contractAddress).call() // 查询账户允许合约的消费限额
            commit('setToken0Balance', token0Balance * 1)
            commit('setAllowance', allowance / Math.pow(10, token0Decimals))
        }

        if (!notFirst) {
            // networkId首次连接监听事件，只切换账户不需要（会重复监听）
            dispatch('contractEvents')
        }
    },
    contractEvents({ state, commit }) {
        // 订阅合约 events
        console.log('contractEvents')
        commit('clearTrades')
        state.contract.getPastEvents(
            'Trade',
            {
                fromBlock: 0,
                toBlock: 'latest'
            },
            (err, event) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log('PastTrades', event)
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
                        _list.forEach(async (item) => {
                            const block = await state.web3.eth.getBlock(item.blockNumber)
                            item.time = block.timestamp * 1000
                            commit('setTrade', item)
                        })
                    }
                }
            }
        )
        state.contract.events.Trade(
            {
                fromBlock: 'latest'
                // fromBlock: 0,
                // toBlock: 'latest'
            },
            async (err, event) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log('event', event.event, event)
                    if (event.event === 'Trade') {
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
    },
    // 获取持仓
    async getPosition({ state, commit, dispatch }) {
        const position = await state.contract.methods.traders(state.coinbase).call()
        const { longAmount, longPrice, margin, shortAmount, shortPrice } = position
        commit('setPosition', {
            longAmount: longAmount * 1,
            longPrice: longPrice * 1,
            margin: margin * 1,
            shortAmount: shortAmount * 1,
            shortPrice: shortPrice * 1
        })
        dispatch('getPoolData')
    },
    // 更新数据
    async refreshData({ state, commit, dispatch }) {
        let balance = await state.web3.eth.getBalance(state.coinbase)
        balance = state.web3.utils.fromWei(balance, 'ether')
        commit('setBalance', balance * 1)
        const token0Balance = await state.token0.methods.balanceOf(state.coinbase).call()
        commit('setToken0Balance', token0Balance * 1)
        dispatch('getPosition')
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
                state.contract.methods.dailyInterestRateBase().call()
            ])
            const poolLongPrice = res[0] * 1
            const poolShortPrice = res[1] * 1
            const totalPool = res[2] * 1
            const poolLongAmount = res[3] * 1
            const poolShortAmount = res[4] * 1
            const price = res[5] * 1
            commit('setPoolLongPrice', poolLongPrice)
            commit('setPoolShortPrice', poolShortPrice)
            commit('setTotalPool', totalPool)
            commit('setPoolLongAmount', poolLongAmount)
            commit('setPoolShortAmount', poolShortAmount)
            commit('setPrice', price)
            const poolNet =
                totalPool +
                (poolLongAmount * price + poolShortAmount * poolShortPrice) -
                (poolLongAmount * poolLongPrice + poolShortAmount * price)
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
    resetApp({ commit }) {
        commit('setWeb3', null)
        commit('setProvider', null)
        commit('setContract', null)
        commit('setCoinbase', '')
        commit('setBalance', 0)
        commit('setPosition', {})
        commit('setPrice', 0)

        commit('setPoolLongPrice', 0)
        commit('setPoolShortPrice', 0)
        commit('setTotalPool', 0)
        commit('setPoolLongAmount', 0)
        commit('setPoolShortAmount', 0)
    }
}
