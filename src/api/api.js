[
	// 前端接口
	// 1.GET /contract/trade_pairs 获取交易对列表
	// 返回，json，交易对格式为：first/second
	{
		"result": true,
		"data": [["first", "second"], ["first", "second"]]
	},
	// 2.GET /contract/explosive?addr={0x...} 获取用户自己的爆仓记录
	// 返回，json
	{
		"result": true,
		"data": [{
			"trade_pair": "eth / usdt", //爆仓交易对
			"price": 1.0,//爆仓价格
			"direction": 0, //多仓，1空仓
			"amount": 10, //爆仓的仓位量
			"ts": 1627032490000 //爆仓时间戳，毫秒
		},]
	},
	// 3.GET /contract/interest?addr={0x...} 获取用户自己的利息收取记录
	// 返回，json
	{
		"result": true,
		"data": [{
			"trade_pair": "eth / usdt", //交易对
			"price": 1.0,//触发价格
			"direction": 0, //触发方向
			"interest": 10, //利息扣减量
			"ts": 1627032490000 //爆仓时间戳，毫秒
		},]
	},
	// 统一错误返回格式
	{
		"result": false,
		"err_msg": "错误原因"
	}
]