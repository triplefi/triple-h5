import Big from 'big.js'
Big.NE = -9

export const screenFull = () => {
    var docElm = document.documentElement
    //W3C
    if (docElm.requestFullscreen) {
        docElm.requestFullscreen()
    }
    //FireFox
    else if (docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen()
    }
    //Chrome等
    else if (docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen()
    }
    //IE11
    else if (docElm.msRequestFullscreen) {
        docElm.msRequestFullscreen()
    }
}

export const exitFull = () => {
    if (document.exitFullscreen) {
        document.exitFullscreen()
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
    } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen()
    } else {
        window.parent.showTopBottom()
    }
}

export const checkFull = (scope) => {
    window.addEventListener('resize', () => {
        const isFull =
            document.fullscreen ||
            document.mozFullScreen ||
            document.webkitIsFullScreen ||
            document.msFullscreenElement ||
            window.fullScreen
        scope.isFull = isFull
    })
}

// 金额，三行逗号隔开
export const formatMoney = (num) => {
    if (num === undefined || num === null || Number(num) === Infinity) return 0
    if (Number(num) === 0) return num // 0.00...
    if (!num || !Number(num)) return 0
    let isNegative = false // 负数？
    if (Math.abs(Number(num)) < 1000) {
        return num
    }
    if (Number(num) < 0) {
        isNegative = true
        num = -num
    }

    let right = String(num).split('.')[1]
    right = right === undefined ? '' : right // 有小数位？
    num = String(num).split('.')[0]
    let len = num.length
    let r = len % 3
    if (len > 3) {
        num =
            r > 0
                ? num.slice(0, r) + ',' + num.slice(r, len).match(/\d{3}/g).join(',')
                : num.slice(r, len).match(/\d{3}/g).join(',')
    }
    if (right) {
        num = num + '.' + right
    }
    if (isNegative) {
        num = '-' + num
    }
    return num
}

export const formatDateTime = (val, formatString) => {
    let dataTime = new Date(val * 1)
    let date = {
        'M+': dataTime.getMonth() + 1,
        'd+': dataTime.getDate(),
        'h+': dataTime.getHours(),
        'm+': dataTime.getMinutes(),
        's+': dataTime.getSeconds(),
        'q+': Math.floor((dataTime.getMonth() + 3) / 3),
        'S+': dataTime.getMilliseconds()
    }
    if (/(y+)/i.test(formatString)) {
        formatString = formatString.replace(RegExp.$1, (dataTime.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (let k in date) {
        if (new RegExp('(' + k + ')').test(formatString)) {
            formatString = formatString.replace(
                RegExp.$1,
                RegExp.$1.length === 1 ? date[k] : ('00' + date[k]).substr(('' + date[k]).length)
            )
        }
    }
    return formatString
}

/**
 * 格式化数字精度
 * @param {string|number} val val
 * @param {number} precision 精度
 * @param {boolean} isRound true 向上取值，false 向下取值
 */
export const formatNum = (val, precision, isRound = false) => {
    if (
        typeof val === 'undefined' ||
        val === null ||
        Number(val) === Infinity ||
        isNaN(val) ||
        val === 0 ||
        val === '0' ||
        Number(val) === 0
    ) {
        val = 0
    }
    try {
        return Big(Number(val))
            .round(precision, isRound ? 3 : 0)
            .toFixed(precision)
    } catch (err) {
        console.error(err)
        return val
    }
}

/*
 * js数组排序 支持数字和字符串
 * @param attr   string     必填  属性名称
 * @param type  boolean  选填 默认非数字
 * @param rev     boolean     选填  默认true 正顺  false反顺
 */
export const sortBy = (attr, type = false, rev = true) => {
    rev = rev ? 1 : -1
    return function (a, b) {
        a = a[attr]
        b = b[attr]
        if (type) {
            if (rev > 0) {
                return Number(a) - Number(b)
            } else {
                return Number(b) - Number(a)
            }
        } else {
            if (a < b) {
                return rev * -1
            }
            if (a > b) {
                return rev * 1
            }
            return 0
        }
    }
}

// 获取coin Icon
export const getCoinIcon = (coin) => {
    let icon = ''
    try {
        icon = require(`@/assets/coin/coin_${coin}.png`)
    } catch (error) {
        icon = require(`@/assets/coin/coin.png`)
    }
    return icon
}

// 获取节点配置文件
export const getNetConfig = () => {
    return [
        {
            type: 'matic',
            label: 'Polygon',
            icon: 'ic_matic',
            id: 137,
            size: 16,
            token: 'MATIC',
            rpc: 'https://polygon-rpc.com',
            explorerUrl: 'https://polygonscan.com',
            nativeCurrency: {
                name: 'MATIC',
                decimals: 18,
                symbol: 'MATIC'
            }
        },
        {
            type: 'matic',
            label: 'Mumbai',
            icon: 'ic_matic',
            id: 80001,
            size: 16,
            token: 'MATIC',
            rpc: 'https://rpc-mumbai.matic.today',
            explorerUrl: 'https://mumbai.polygonscan.com/',
            nativeCurrency: {
                name: 'MATIC',
                decimals: 18,
                symbol: 'MATIC'
            }
        },
        {
            type: 'gateio',
            label: 'Gate-Meteore',
            icon: 'ic_gateio',
            id: 85,
            size: 16,
            token: 'GT',
            rpc: 'https://meteora-evm.gatenode.cc',
            explorerUrl: 'https://gatescan.org/',
            nativeCurrency: {
                name: 'GT',
                decimals: 18,
                symbol: 'GT'
            }
        }
    ]
}
// 判断是否为支持的节点
export const checkSupportChain = (id) => {
    return [137, 80001, 85].includes(parseInt(id))
}
// 判断是否为matic节点
export const checkMatic = (id) => {
    return id == 80001 || id == 137
}
// 判断是否为主网节点
export const checkMain = (id) => {
    return id == 137
}
// 根据链ID，获取api，wss地址
export const getNetUrl = (url) => {
    const netDic = {
        137: 'polygon.triple.fi',
        80001: 'mumbai.triple.fi',
        // 85: 'meteora.triple.fi',
        85: 'mumbai.triple.fi'
    }
    const curChainId = window.localStorage.getItem('curChainId')
    let netUrl = netDic[curChainId]
    if (!netUrl) {
        netUrl = netDic[137]
    }
    const replaceList = ['://triple.fi', '://www.triple.fi', '://test.triple.fi', /:\/\/127.0.0.1:\d{4}/]
    replaceList.forEach((e) => {
        url = url.replace(e, '://' + netUrl)
    })
    // url = url.replace(/http:\/\//, 'https://')
    return url
}
