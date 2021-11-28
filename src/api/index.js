import request from '../utils/request'

export const fetchData = (query) => {
    return request({
        url: './table.json',
        method: 'get',
        params: query
    })
}

// 获取交易对列表
export const getTradePairs = (query) => {
    return request({
        url: '/api/contract/trade_pairs',
        method: 'get',
        params: query
    })
    // return Promise.resolve({
    //   result: true,
    //   data: [
    //     {
    //       contract: "0xB21ceaec9B2259F28e839c87F8AeE35f835F3C7D",
    //       margin_address: "0x1660854c03b461E6BC07f94567D1D6E6bF99a1A9",
    //       margin_coin: "usdt",
    //       trade_coin: "eth",
    //     },
    //     {
    //       contract: "0x7694b17D2837c4c124B502Ed9C029c19425E72C6",
    //       margin_address: "0x1660854c03b461E6BC07f94567D1D6E6bF99a1A9",
    //       margin_coin: "usdt",
    //       trade_coin: "bnb",
    //     },
    //   ],
    // });
}

// 获取交易对列表
export const getTradeKline = (query) => {
    return request({
        url: '/api/contract/kline',
        method: 'get',
        params: query
    })
}

// 获取用户自己的爆仓记录
export const getUserExplosive = ({ addr }) => {
    return request({
        url: '/api/contract/explosive',
        method: 'get',
        params: { addr }
    })
}

// 获取用户自己的利息收取记录
export const getUserInterest = ({ addr }) => {
    return request({
        url: '/api/contract/interest',
        method: 'get',
        params: { addr }
    })
}

// 获取测试币
export const getTestCoin = (address) => {
    return request({
        url: '/api/account/gettestcoin',
        method: 'get',
        params: { user: address }
    })
}
