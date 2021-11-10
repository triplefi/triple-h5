计算公式：
1.Unrealized PL:
结果为保证金代币（也就是token0）数量，精度为token0的精度。
多仓（long）：多仓持仓量（Trader.longAmount) * { 当前价格（index price) - 多仓开仓均价（Trader.longPrice)}
空仓（short) ：空仓持仓量（Trader.shortAmount) * { 空仓开仓均价（Trader.shortPrice) - 当前价格（index price）}。
2.Index price：
当前指数价格，就是合约中getLatestPrice函数获取到的值，其精度为：token0精度 + 每张合约的精度（合约中的amountDecimal）。
3.Net value：
账户净值 = 用户保证金（Trader.margin）+ 多仓浮动盈亏 + 空仓浮动盈亏（浮动盈亏就是1中的两个Unrealized PL）。
4.User margin
用户保证金 = Trader.margin
5.百分比开仓功能:
已占用保证金量:usedMargin = [(Trader.longAmount + Trader.shortAmount) * 当前价格（index price）] / 杠杆率(leverage);
可用保证金canUseMargin = 用户净值（3的计算）- usedMargin
用户钱包余额：用户地址中token0的数量，leftAmount
也就是用户总可用保证金为total = canUseMargin + leftAmount
设最大可开仓量为x，开仓价格为price（index price * (1 ± slideP/divConst)多仓为+，空仓为-），手续费率为r（合约中的feeRate除以divConst），杠杆率为l（合约中的leverage）
则有：x * price / l = total - x * price * r，解方程得：
x = total / (price/l + price*r).
单笔可开仓量最大值限制：limitSAmount = 对冲池净值（合约函数getPoolNet）*比例系数（合约中的singleTradeLimitRate/divConst）/标准价格（合约函数getLatestPrice）
x和limitSAmount取较小值，做为用户开仓量的100%；其他的开仓比例按照比例计算即可。
6.开仓时需要转入合约的保证金数量rechargeAmount
设本次开仓量为x张合约，则需要的保证金数为：
NeedMargin = (price(每张合约的当前价格) * (1± slideP / divConst) (开多仓为 +, 开空仓为 -)) * amount（开仓量）)* (r(同5) + 1 / leverage)
用户现有可用保证金按照5中的canUseMargin 来计算。
如果 NeedMargin <= canUseMargin，则rechargeAmount = 0；
否则，rechargeAmount = NeedMargin - canUseMargin；
7.对冲池净值计算
poolNet = totalPool + (poolLongAmount * price + poolShortAmount * poolShortPrice) - (poolLongAmount * poolLongPrice + poolShortAmount * price);
用合约函数也可以得到此值：getPoolNet，区别是如果计算结果为小于等于0的数，返回错误。
8.预估爆仓价:
维持保证金：keepMargin = (Trader.longAmount * Trader.longPrice + Trader.shortAmount * Trader.shortPrice) / 30;
设爆仓价格为x，依据爆仓价计算净值如下：
Net = 用户保证金（Trader.margin）+ 多仓持仓量（Trader.longAmount) * { x - 多仓开仓均价（Trader.longPrice)} + 空仓持仓量（Trader.shortAmount) * { 空仓开仓均价（Trader.shortPrice) - x}
当net = keepMargin时，可以解出x的值：
x = （keepMargin - Trader.margin + Trader.longAmount * Trader.longPrice - Trader.shortAmount * Trader.shortPrice）/（Trader.longAmount - Trader.shortAmount）
当Trader.longAmount == Trader.shortAmount时，无爆仓价格。