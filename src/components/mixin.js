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
            'priceExcursion',
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
            const deltaR0Limit = 50000
            const deltaR2Limit = 100000
            let blockNumber = await this.web3.eth.getBlockNumber()
            let R0 = await this.contract.methods.R0().call()
            let R1 = await this.contract.methods.R1().call()
            let R2 = await this.contract.methods.R2().call()
            console.log(R0)
            if (blockNumber != R0[1]) {
                R2 = [...R1]
                R1 = [...R0]
                R0[0] = R
                R0[1] = blockNumber
                R0[2] = 0
                if (R1[1] != blockNumber - 1) {
                    R2 = [...R1]
                    R1 = [...R0]
                    R1[1] = blockNumber - 1
                }
                if (R2[1] != blockNumber - 2) {
                    R2 = [...R1]
                    R2[1] = blockNumber - 2
                }
            }
            let deltaR1 = R - R0[0]
            let deltaR2 = R - R2[0]
            if (deltaR1 > deltaR0Limit || deltaR2 > deltaR2Limit) {
                R0[2] = 1
                return 1 // buy price +
            } else if (deltaR1 < -deltaR0Limit || deltaR2 < -deltaR2Limit) {
                R0[2] = -1
                return -1 // sell price -
            }
            return R1[2]
        },
        // 计算下单偏移，getter中的slidePrice + 计算结果
        //direction +1 means buy(open-long, close-short)，-1 means sell(open-short, close-long)
        async poolLimitTrade(direction) {
            let { price, priceExcursion, divConst, poolShortAmount, poolLongAmount, poolNet } = this
            const deltaRSlidePriceRate = 10000
            const R = (direction * (poolShortAmount - poolLongAmount) * price * divConst) / poolNet
            const D = await this.getDeltaPriceByR(R)
            let slidePrice = 0
            if (D == direction) {
                slidePrice = (price * (divConst + deltaRSlidePriceRate)) / divConst
            }

            if ((direction == 1 && priceExcursion > 0) || (direction == -1 && priceExcursion < 0)) {
                priceExcursion = priceExcursion / divConst
                slidePrice = slidePrice - Math.abs(priceExcursion)
            }
            return slidePrice
        }
    }
}
