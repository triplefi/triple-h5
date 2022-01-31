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
            'deadline'
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
            // if (this.decimals && this.amountDecimal) {
            const _decimals = this.decimals * 1 + this.amountDecimal * 1
            return formatNum(val / Math.pow(10, _decimals), _decimals)
            // } else {
            //     return val
            // }
        },
        amountPrecision(val) {
            // amount换算和精度
            return formatNum(val / Math.pow(10, Math.abs(this.amountDecimal * 1)), Math.abs(this.amountDecimal * 1))
        },
        toBN(val) {
            return this.web3.utils.toBN(val).toString()
        },
        async handleApprove() {
            const approve = '0xfffffffffffffffffffffffffffffffe'
            const bol = await this.token0.methods
                .approve(this.contractAddress, this.toBN(approve)) // 允许合约消费限额
                .send({ from: this.coinbase })
            console.log('approve', bol)
            const token0Decimals = await this.token0.methods.decimals().call() // token0精度
            const allowance = await this.token0.methods.allowance(this.coinbase, this.contractAddress).call() // 查询账户允许合约的消费限额
            this.$store.commit('setAllowance', allowance / Math.pow(10, token0Decimals))
            this.$message({
                type: 'success',
                message: 'Approve Succeeded'
            })
        }
    }
}
