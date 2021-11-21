export default {
    tradeCoin(state) {
        return state.pairInfo.trade_coin.toUpperCase()
    },
    marginCoin(state) {
        return state.pairInfo.margin_coin.toUpperCase()
    },
    symbol(state, getters) {
        return getters.tradeCoin + '/' + getters.marginCoin
    },
    NewPrice(state) {
        if (state.trades.length) {
            return state.trades[0].price
        } else {
            return 0
        }
    },
    // UsedMargin=(longAmount*longPrice+shortAmount*shortPrice)/leverage;
    UsedMargin(state) {
        if (JSON.stringify(state.position) !== '{}') {
            const { longAmount, shortAmount, longPrice, shortPrice } = state.position
            const { leverage } = state
            return Math.floor((longAmount * longPrice + shortAmount * shortPrice) / leverage)
        } else {
            return 0
        }
    },
    //多仓,空仓偏移价格
    slidePrice(state) {
        const { poolLongAmount, poolShortAmount, price, poolNet, divConst, slideP, poolNetAmountRateLimitPrice } = state
        const rV = poolLongAmount - poolShortAmount // pool净头寸
        const R = ((rV * price) / poolNet) * divConst || 0 //净头⼨⽐率
        let slideRate = 0
        if (R >= (poolNetAmountRateLimitPrice * 3) / 2) {
            slideRate = poolNetAmountRateLimitPrice / 10 + (2 * R - 3 * poolNetAmountRateLimitPrice) / 5
        } else if (R >= poolNetAmountRateLimitPrice) {
            slideRate = (R - poolNetAmountRateLimitPrice) / 5
        }
        return (price * (slideRate + slideP)) / divConst
    },
    // NetValue=longAmount*(price - openPrice) + shortAmount*(openPrice - price) + margin;
    NetValue(state) {
        if (JSON.stringify(state.position) !== '{}') {
            const { longPrice, longAmount, shortPrice, shortAmount, margin } = state.position
            const { price } = state
            return longAmount * (price - longPrice) + shortAmount * (shortPrice - price) + margin * 1
        } else {
            return 0
        }
    },
    LongMaxAmount(state, getters) {
        if (JSON.stringify(state.position) !== '{}') {
            // const { longAmount, shortAmount } = state.position
            const { price, leverage, token0Balance, poolNet, feeRate, divConst, singleTradeLimitRate, slideP } = state
            // 已占用保证金量:usedMargin = [(Trader.longAmount + Trader.shortAmount) * 当前价格（index price）] / 杠杆率(leverage);
            // const usedMargin = ((longAmount + shortAmount) * price) / leverage
            // 可用保证金canUseMargin = 用户净值（3的计算）- usedMargin
            // const canUseMargin = getters.NetValue - getters.UsedMargin
            // 用户钱包余额：用户地址中token0的数量，leftAmount
            const leftAmount = token0Balance
            // 也就是用户总可用保证金为total = canUseMargin + leftAmount
            const total = getters.canUseMargin + leftAmount
            // 设最大可开仓量为x，开仓价格为price（多仓为index price + slideP；空仓为index price - slideP(为合约中的固定值，系统设定)），手续费率为r（合约中的feeRate除以divConst），杠杆率为l（合约中的leverage）
            // 则有：x * price / l = total - x * price * r，解方程得：
            // x = total / (price/l + price*r)
            const openPrice = price * (1 + slideP / divConst)
            const r = feeRate / divConst
            const xL = Math.floor(total / (openPrice / leverage + openPrice * r))
            // const x = xL || xS
            // 单笔可开仓量最大值限制：limitSAmount = 对冲池净值（合约函数getPoolNet）*比例系数（合约中的singleTradeLimitRate/divConst）/标准价格（合约函数getLatestPrice）
            // x和limitSAmount取较小值，做为用户开仓量的100%；其他的开仓比例按照比例计算即可。
            let limitSAmount = Math.floor((poolNet * singleTradeLimitRate) / divConst / price)
            return Math.min(limitSAmount, xL)
        } else {
            return 0
        }
    },
    ShortMaxAmount(state, getters) {
        if (JSON.stringify(state.position) !== '{}') {
            // const { longAmount, shortAmount } = state.position
            const { price, leverage, token0Balance, poolNet, feeRate, divConst, singleTradeLimitRate, slideP } = state
            // 已占用保证金量:usedMargin = [(Trader.longAmount + Trader.shortAmount) * 当前价格（index price）] / 杠杆率(leverage);
            // const usedMargin = ((longAmount + shortAmount) * price) / leverage
            // // 可用保证金canUseMargin = 用户净值（3的计算）- usedMargin
            // const canUseMargin = getters.NetValue - usedMargin
            // 用户钱包余额：用户地址中token0的数量，leftAmount
            const leftAmount = token0Balance
            // 也就是用户总可用保证金为total = canUseMargin + leftAmount
            const total = getters.canUseMargin + leftAmount
            // 设最大可开仓量为x，开仓价格为price（多仓为index price + slideP；空仓为index price - slideP(为合约中的固定值，系统设定)），手续费率为r（合约中的feeRate除以divConst），杠杆率为l（合约中的leverage）
            // 则有：x * price / l = total - x * price * r，解方程得：
            // x = total / (price/l + price*r). = total / price / (1/l + r)
            const r = feeRate / divConst
            const openPrice = price * (1 - slideP / divConst)
            const xS = Math.floor(total / (openPrice / leverage + openPrice * r))
            // const x = xL || xS
            // 单笔可开仓量最大值限制：limitSAmount = 对冲池净值（合约函数getPoolNet）*比例系数（合约中的singleTradeLimitRate/divConst）/标准价格（合约函数getLatestPrice）
            // x和limitSAmount取较小值，做为用户开仓量的100%；其他的开仓比例按照比例计算即可。
            let limitSAmount = Math.floor((poolNet * singleTradeLimitRate) / divConst / price)
            return Math.min(limitSAmount, xS)
        } else {
            return 0
        }
    },
    canUseMargin(state, getters) {
        if (JSON.stringify(state.position) !== '{}') {
            // const { longAmount, shortAmount } = state.position
            // const { price, leverage } = state
            // 已占用保证金量:usedMargin = [(Trader.longAmount + Trader.shortAmount) * 当前价格（index price）] / 杠杆率(leverage);
            // const usedMargin = ((longAmount + shortAmount) * price) / leverage
            // 可用保证金canUseMargin = 用户净值（3的计算）- usedMargin
            return getters.NetValue - getters.UsedMargin
        } else {
            return 0
        }
    },
    LiquidationPrice(state) {
        // 6.预估爆仓价:
        if (JSON.stringify(state.position) !== '{}') {
            const { longPrice, longAmount, shortPrice, shortAmount, margin } = state.position
            // 当Trader.longAmount == Trader.shortAmount时，无爆仓价格。
            if (longAmount == shortAmount) return 0
            // 维持保证金：keepMargin = (Trader.longAmount * Trader.longPrice + Trader.shortAmount * Trader.shortPrice) / 30;
            const keepMargin = (longAmount * longPrice + shortAmount * shortPrice) / 30
            // 设爆仓价格为x，依据爆仓价计算净值如下：
            // Net = 用户保证金（Trader.margin）+ 多仓持仓量（Trader.longAmount) * {x - 多仓开仓均价（Trader.longPrice)} + 空仓持仓量（Trader.shortAmount) * {空仓开仓均价（Trader.shortPrice) - x}
            // const Net = margin + longAmount * (y - longPrice) + shortAmount * (shortPrice - y)
            // 当net = keepMargin时，可以解出x的值：
            // x = （keepMargin - Trader.margin + Trader.longAmount * Trader.longPrice - Trader.shortAmount * Trader.shortPrice）/（Trader.longAmount - Trader.shortAmount）
            return (
                (keepMargin - margin + longAmount * longPrice - shortAmount * shortPrice) / (longAmount - shortAmount)
            )
        } else {
            return 0
        }
    }
}
