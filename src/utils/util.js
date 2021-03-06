import Big from 'big.js'
Big.NE = -9

export const screenFull = () => {
  var docElm = document.documentElement;
  //W3C
  if (docElm.requestFullscreen) {
    docElm.requestFullscreen();
  }
  //FireFox 
  else if (docElm.mozRequestFullScreen) {
    docElm.mozRequestFullScreen();
  }
  //Chrome等 
  else if (docElm.webkitRequestFullScreen) {
    docElm.webkitRequestFullScreen();
  }
  //IE11
  else if (docElm.msRequestFullscreen) {
    docElm.msRequestFullscreen();
  }
}

export const exitFull = () => {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  }
  else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
  else if (document.mozCancelFullScreen) {
    document.mozCancelFullScreen();
  }
  else if (document.webkitCancelFullScreen) {
    document.webkitCancelFullScreen();
  } else {
    window.parent.showTopBottom();
  }
}

export const checkFull = (scope) => {
  window.addEventListener("resize", () => {
    scope.isFull =
      window.document.documentElement.clientWidth === window.screen.width &&
      window.document.documentElement.clientHeight === window.screen.height;
  });
}

// 金额，三行逗号隔开
export const formatMoney = (num) => {
  if (num === undefined || num === null || Number(num) === Infinity) return 0;
  if (Number(num) === 0) return num; // 0.00...
  if (!num || !Number(num)) return 0;
  let isNegative = false; // 负数？
  if (Number(num) < 1000) {
    return num;
  }
  if (Number(num) < 0) {
    isNegative = true;
    num = -num;
  }

  let right = String(num).split('.')[1];
  right = (right === undefined) ? '' : right; // 有小数位？
  num = String(num).split('.')[0];
  let len = num.length;
  let r = len % 3;
  if (len > 3) {
    num = r > 0 ? num.slice(0, r) + ',' + num.slice(r, len).match(/\d{3}/g).join(',') : num.slice(r, len).match(/\d{3}/g).join(',');
  }
  if (right) {
    num = num + '.' + right;
  }
  if (isNegative) {
    num = '-' + num;
  }
  return num;
};

export const formatDateTime = (val, formatString) => {
  let dataTime = new Date(val * 1);
  let date = {
    'M+': dataTime.getMonth() + 1,
    'd+': dataTime.getDate(),
    'h+': dataTime.getHours(),
    'm+': dataTime.getMinutes(),
    's+': dataTime.getSeconds(),
    'q+': Math.floor((dataTime.getMonth() + 3) / 3),
    'S+': dataTime.getMilliseconds()
  };
  if (/(y+)/i.test(formatString)) {
    formatString = formatString.replace(RegExp.$1, (dataTime.getFullYear() + '').substr(4 - RegExp.$1.length));
  }
  for (let k in date) {
    if (new RegExp('(' + k + ')').test(formatString)) {
      formatString = formatString.replace(RegExp.$1, RegExp.$1.length === 1
        ? date[k] : ('00' + date[k]).substr(('' + date[k]).length));
    }
  }
  return formatString;
};

/**
 * 格式化数字精度
 * @param {string|number} val val
 * @param {number} precision 精度
 * @param {boolean} isRound true 向上取值，false 向下取值
 */
export const formatNum = (val, precision, isRound = false) => {
  if (typeof val === 'undefined' || val === null || Number(val) === Infinity || isNaN(val) || val === 0 || val === '0' || Number(val) === 0) {
    val = 0
  }
  try {
    return Big(Number(val)).round(precision, isRound ? 3 : 0).toFixed(precision)
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
  rev = (rev) ? 1 : -1
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