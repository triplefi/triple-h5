import { mapState, mapActions, mapGetters } from 'vuex'
import { formatNum } from '@/utils/util'
export default {
    computed: {
        ...mapState([
            'web3',
            'coinbase',
            'contract',
            'contractAddress',
            'decimals',
            'amountDecimal',
            'token0',
            'price',
            'priceExcursionDown',
            'priceExcursionUp',
            'deadline',
            'poolNet',
            'poolShortAmount',
            'poolLongAmount',
            'divConst'
        ]),
        ...mapGetters(['marginCoin', 'tradeCoin'])
    },
    methods: {
        ...mapActions(['refreshData']),
        // 延迟刷新数据
        delayRefreshData() {
            setTimeout(() => {
                this.refreshData()
            }, 800)
        },
        formatDecimals(val) {
            // 合约换算和精度
            return formatNum(val / Math.pow(10, this.decimals), this.decimals * 1)
        },
        pricePrecision(val) {
            // 价格换算和精度
            if (this.decimals || this.amountDecimal) {
                const _decimals = this.decimals * 1 + this.amountDecimal * 1
                return formatNum(val / Math.pow(10, _decimals), _decimals)
            } else {
                return '0.0000'
            }
        },
        amountPrecision(val) {
            // amount换算和精度
            return formatNum(val / Math.pow(10, Math.abs(this.amountDecimal * 1)), Math.abs(this.amountDecimal * 1))
        },
        toBN(val) {
            return this.web3.utils.toBN(val).toString()
        },
        async handleApprove() {
            const gasPrice = await this.web3.eth.getGasPrice()
            const approve = '0xfffffffffffffffffffffffffffffffe'
            const bol = await this.token0.methods
                .approve(this.contractAddress, this.toBN(approve)) // 允许合约消费限额
                .send({ from: this.coinbase, gasPrice })
            console.log('approve', bol)
            const token0Decimals = await this.token0.methods.decimals().call() // token0精度
            const allowance = await this.token0.methods.allowance(this.coinbase, this.contractAddress).call() // 查询账户允许合约的消费限额
            this.$store.commit('setAllowance', allowance / Math.pow(10, token0Decimals))
            this.$message({
                type: 'success',
                message: 'Approve Succeeded'
            })
        },
        async getDeltaPriceByR(R) {
            if (!this.web3 || !this.contract) {
                return 0
            }
            const deltaR0Limit = (await this.contract.methods.deltaR0Limit().call()) * 1
            const deltaR2Limit = (await this.contract.methods.deltaR2Limit().call()) * 1
            console.log(deltaR0Limit, deltaR2Limit, '++++++')
            let blockNumber = await this.web3.eth.getBlockNumber()
            let R0 = await this.contract.methods.R0().call()
            let R1 = await this.contract.methods.R1().call()
            let R2 = await this.contract.methods.R2().call()
            if (blockNumber != R0.number) {
                R2 = { ...R1 }
                R1 = { ...R0 }
                R0.number = blockNumber
                R0.initR = R
                R0.deltaR = 0
                if (R1.number != blockNumber - 1) {
                    R2 = { ...R1 }
                    R1 = { ...R0 }
                    R1.number = blockNumber - 1
                }
                if (R2.number != blockNumber - 2) {
                    R2 = { ...R1 }
                    R2.number = blockNumber - 2
                }
            }
            let deltaR1 = R - R0.initR
            let deltaR2 = R - R2.initR
            if (deltaR1 > deltaR0Limit || deltaR2 > deltaR2Limit) {
                R0.deltaR = 1
                return 1 // buy price +
            } else if (deltaR1 < -deltaR0Limit || deltaR2 < -deltaR2Limit) {
                R0.deltaR = -1
                return -1 // sell price -
            }
            return R1.deltaR
        },
        // 计算下单偏移，getter中的slidePrice + 计算结果
        //direction +1 means buy(open-long, close-short)，-1 means sell(open-short, close-long)
        async poolLimitTrade(direction) {
            let { price, divConst, poolShortAmount, poolLongAmount, poolNet } = this
            const deltaRSlidePriceRate = (await this.contract.methods.deltaRSlidePriceRate().call()) * 1
            const R = (direction * (poolShortAmount - poolLongAmount) * price * divConst) / poolNet
            const D = await this.getDeltaPriceByR(R)
            let slidePrice = 0
            if (D == direction) {
                slidePrice = (price * deltaRSlidePriceRate) / divConst
            }
            return slidePrice
        }
    }
}
