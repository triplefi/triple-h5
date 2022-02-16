export default {
    /* 交易 Trade */
    // 平多仓函数
    async closeLong({ state }, { priceExp, amount, deadline }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods
            .closeLong(priceExp, amount, deadline)
            .send({ from: state.coinbase, gasPrice })
    },
    // 平空仓函数
    async closeShort({ state }, { priceExp, amount, deadline }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods
            .closeShort(priceExp, amount, deadline)
            .send({ from: state.coinbase, gasPrice })
    },
    // 开多仓函数
    async openLong({ state }, { priceExp, amount, deadline }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods
            .openLong(priceExp, amount, deadline)
            .send({ from: state.coinbase, gasPrice })
    },
    // 开空仓函数
    async openShort({ state }, { priceExp, amount, deadline }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods
            .openShort(priceExp, amount, deadline)
            .send({ from: state.coinbase, gasPrice })
    },
    // 保证金充值
    async rechargeMargin({ state }, { amount }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods.rechargeMargin(amount).send({ from: state.coinbase, gasPrice })
    },
    // 提取保证金
    async withdrawMargin({ state }, { amount }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods.withdrawMargin(amount).send({ from: state.coinbase, gasPrice })
    },
    // 获取流动池净值
    async getPoolNet({ state }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods.getPoolNet().call({ from: state.coinbase, gasPrice })
    },
    /* 流动性Pool */
    // 增加流动性
    async addLiquidity({ state }, { amount, to }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods.addLiquidity(amount, to).send({ from: state.coinbase, gasPrice })
    },
    // 从池子中移除流动性
    async removeLiquidity({ state }, { liquidity, to }) {
        const gasPrice = await state.web3.eth.getGasPrice()
        return await state.contract.methods.removeLiquidity(liquidity, to).send({ from: state.coinbase, gasPrice })
    }
}
