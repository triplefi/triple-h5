计算公式： 1.当前指数价格 indexPrice：
当前指数价格，就是合约中 getLatestPrice 函数获取到的值。其含义为每张合约的 token0 价格。其精度为：token0 精度。
2.Unrealized PL:
结果为保证金代币（也就是 token0）数量，精度为 token0 的精度。
多仓（long）upl：多仓持仓量 Trader.longAmount _ (index price - 多仓开仓均价（Trader.longPrice);
空仓（short)upl：空仓持仓量（Trader.shortAmount) _ (空仓开仓均价（Trader.shortPrice) - index price); 3.用户净值 Net value：
账户净值=用户保证金（Trader.margin）+ 多仓 upl + 空仓 upl;
4.User margin
用户保证金 = Trader.margin 
5.对冲池净值计算
poolNet = totalPool + (poolLongAmount _ price + poolShortAmount _ poolShortPrice) - (poolLongAmount _ poolLongPrice + poolShortAmount _ price);
用合约函数也可以得到此值：getPoolNet，区别是如果计算结果为小于等于 0 的数，返回错误。 6.百分比开仓功能:
已占用保证金量:usedMargin = (Trader.longAmount*Trader.longPrice + Trader.shortAmount*Trader.shortPrice) / 杠杆率(leverage);
可用保证金 canUseMargin = 用户净值- usedMargin
用户钱包余额：用户地址中 token0 的数量，leftAmount
也就是用户总可用保证金为 total = canUseMargin + leftAmount
pool 净头⼨ = poolLongAmount - poolShortAmount（分正负）
净头⼨⽐率 R = pool 净头⼨*indexPrice/对冲池净值 * 100% _ divConst;
开多仓时，R < 合约中的 poolNetAmountRateLimitOpen;
开空仓时，R > -合约中的 poolNetAmountRateLimitOpen;
价格偏移量为：
slideRate = 0
if (R >= (poolNetAmountRateLimitPrice _ 3) / 2) {
slideRate = poolNetAmountRateLimitPrice / 10 + (2 _ R - 3 _ poolNetAmountRateLimitPrice) / 5;
} else if (R >= poolNetAmountRateLimitPrice) {
slideRate = (R - poolNetAmountRateLimitPrice) / 5;
}
SlidePrice = indexPrice _ (slideRate + slideP) / divConst;
设最大可开仓量为 x，开仓价格为 price(indexPrice ± SlidePrice，多仓为+，空仓为-），手续费率为 r（合约中的 feeRate 除以 divConst），杠杆率为 l（合约中的 leverage）
则有：x _ price / l = total - x _ price _ r，解方程得：
x = total / (price/l + price*r).
单笔可开仓量最大值限制：limitSAmount=对冲池净值* (singleTradeLimitRate / divConst) / indexPrice;
x 和 limitSAmount 取较小值，做为用户开仓量的 100%；其他的开仓比例按照比例计算即可。 7.预估爆仓价:
维持保证金：keepMargin = (Trader.longAmount _ Trader.longPrice + Trader.shortAmount _ Trader.shortPrice) / 30;
设爆仓价格为 x，依据爆仓价计算净值如下：
Net = Trader.margin + Trader.longAmount _ (x - Trader.longPrice) + Trader.shortAmount _ (Trader.shortPrice - x)
当 net = keepMargin 时，可以解出 x 的值：
x = (keepMargin - Trader.margin + Trader.longAmount _ Trader.longPrice - Trader.shortAmount _ Trader.shortPrice) / (Trader.longAmount - Trader.shortAmount)
当 Trader.longAmount == Trader.shortAmount 时，无爆仓价格。
8.Pool
LP Token 是 用户代币在合约中的余额，用户合约的 balanceOf 获取。
Usdt value 是用户代币在对冲池中的比例等价于多少 usdt。
ValuedUsdt = getPoolNet _ (lpToken / totalSuply) 9.流动性可移除量最大值（maxLiquidity）计算
当前指数价格 indexPrice
当前对冲池净值：net = totalPool + (poolLongAmount _ indexPrice+ poolShortAmount _ poolShortPrice) - (poolLongAmount _ poolLongPrice + poolShortAmount * indexPrice);
If net<=0, maxLiquidity=0;
对冲池已用保证金：
uint256 netAmount = poolLongAmount > poolShortAmount
? (poolLongAmount - poolShortAmount)
: (poolShortAmount - poolLongAmount);
uint256 totalAmount = (poolLongAmount + poolShortAmount) / 3;
if (netAmount < totalAmount) {
netAmount = totalAmount;
}
usedMargin=((netAmount*price)_divConst)/ (poolNetAmountRateLimitOpen);
计算对冲池可提现金额的最大值
uint256 canWithdraw = uint256(net) - usedMargin;
maxLiquity = amount _ totalSupply / net;
If maxLiquity > 用户钱包的 lp 数量，则 maxLiquity =lp 数量 10.用户利率公式：
每天利息惩罚基础利率 r0 = dailyInterestRateBase / divConst;
用户实际利率 r1：
If (poolLongAmount>poolShortAmount){
r1 = -r0 _ (poolLongAmount - poolShortAmount) / poolLongAmount;
}else if (poolShortAmount>poolLongAmount){
r1 = r0 _ (poolShortAmount - poolLongAmount) / poolShortAmount;
}else{
r1 = 0;
}
