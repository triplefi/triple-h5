export default {
    /* 交易 Trade */
    // 平多仓函数
    async closeLong({ state }, { priceExp, amount, deadline }) {
        return await state.contract.methods.closeLong(priceExp, amount, deadline).send({ from: state.coinbase })
    },
    // 平空仓函数
    async closeShort({ state }, { priceExp, amount, deadline }) {
        return await state.contract.methods.closeShort(priceExp, amount, deadline).send({ from: state.coinbase })
    },
    // 开多仓函数
    async openLong({ state }, { priceExp, amount, deadline }) {
        return await state.contract.methods.openLong(priceExp, amount, deadline).send({ from: state.coinbase })
    },
    // 开空仓函数
    async openShort({ state }, { priceExp, amount, deadline }) {
        return await state.contract.methods.openShort(priceExp, amount, deadline).send({ from: state.coinbase })
    },
    // 保证金充值
    async rechargeMargin({ state }, { amount }) {
        return await state.contract.methods.rechargeMargin(amount).send({ from: state.coinbase })
    },
    // 提取保证金
    async withdrawMargin({ state }, { amount }) {
        return await state.contract.methods.withdrawMargin(amount).send({ from: state.coinbase })
    },
    // 获取流动池净值
    async getPoolNet({ state }) {
        return await state.contract.methods.getPoolNet().call({ from: state.coinbase })
    },
    /* 流动性Pool */
    // 增加流动性
    async addLiquidity({ state }, { amount, to }) {
        return await state.contract.methods.addLiquidity(amount, to).send({ from: state.coinbase })
    },
    // 从池子中移除流动性
    async removeLiquidity({ state }, { liquidity, to }) {
        return await state.contract.methods.removeLiquidity(liquidity, to).send({ from: state.coinbase })
    }
}
