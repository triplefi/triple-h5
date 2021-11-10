export default class WSUtil {
  constructor (options) {
    if (!options || typeof options !== 'object') {
      throw new Error('the param must be an object!');
    }
    if (Array.isArray(options)) {
      throw new Error('the param must be an object, but recieve an Array!');
    }
    if (!options.url) {
      throw new Error('the options.url must be a string but null or \'\'!');
    }

    this.opt = Object.assign({
      url: '', // ws url
      isAutoInit: true,
      intervalTime: 10000, // 心跳包时间间隔
      timeOut: 120000, // 心跳保持最长时间
      needReconnect: true, // 是否需要重连
      reConnectDelay: 2000, // 断开连接后多少ms重连
      keepAliveMsg: 'ping_p', // 心跳包消息内容
      onErrCall: () => {},
      onCloseCall: (e) => {},
      onOpenCall: (e) => {},
      onMsgCall: (data) => {}
    }, options);
    this.ws = null;
    this.timer = null;
    this.lastHealthTime = -1;
    this.forceReconnect = false; // 强行重连
    this._isWsOpen = false;

    this.opt.isAutoInit && this.initConnect();
  }

  /**
   * @description 初始化连接，绑定ws事件
   * @author LiuTao
   * @memberof WSUtil
   */
  initConnect () {
    if (this.ws) {
      try {
        this.forceReconnect = false;
        this.timer && clearInterval(this.timer);
        this.timer = null;
        this.lastHealthTime = -1;
        this.ws.close();
        this.ws = null;
      } catch (e) {
        // console.error('init 未知异常！', e);
      }
    }

    this.ws = new window.WebSocket(this.opt.url);

    this.ws.onopen = (e) => {
      // console.log('ws opened!!!!');
      this._isWsOpen = true;
      if (this.opt.onOpenCall && typeof this.opt.onOpenCall === 'function') {
        this.opt.onOpenCall(e);
      }
      this.timer = setInterval(() => {
        this._keepAlive();
      }, this.opt.intervalTime);
    };

    this.ws.onmessage = (e) => {
      let data = e.data;
      this.lastHealthTime = +new Date();

      if (this.opt.onMsgCall && typeof this.opt.onMsgCall === 'function') {
        let resData;
        try {
          resData = JSON.parse(data);
        } catch (e) {
          // console.log('消息回包：', data);
          resData = data;
        }
        this.opt.onMsgCall(resData);
      }
    };

    this.ws.onerror = (e) => {
      if (this.opt.onErrCall && typeof this.opt.onErrCall === 'function') {
        // console.error('ws Error!');
        let err = new Error('ws Error!');
        err.code = 100501;
        this.opt.onErrCall(err);
      }
      this.forceReconnect = true;
      this.ws.close();
    };

    this.ws.onclose = () => {
      console.log('ws closed!!!');
      this._isWsOpen = false;
      if (this.opt.onCloseCall && typeof this.opt.onCloseCall === 'function') {
        this.opt.onCloseCall();
      }
      this.timer && clearInterval(this.timer);
      if (this.forceReconnect === true) {
        this.forceReconnect = false;
        this.timer = null;
        if (this.opt.needReconnect) {
          this.ws = null;
          // 重连
          setTimeout(() => {
            this.initConnect();
          }, this.opt.reConnectDelay);
        }
      }
    };
  }

  /**
   * @description 保持通讯状态
   * @author LiuTao
   * @memberof WSUtil
   */
  _keepAlive () {
    let time = new Date();

    if (this.lastHealthTime !== -1 && (time.getTime() - this.lastHealthTime) > this.opt.timeOut) {
      // console.error(time, ' --- 服务器没有响应');
      this.forceReconnect = false;
      this.ws.close();
      this.timer && clearInterval(this.timer);
      this.timer = null;
      if (this.opt.needReconnect) {
        this.ws = null;
        // 重连
        setTimeout(() => {
          this.initConnect();
        }, this.opt.reConnectDelay);
      }
      return;
    }
    // 发送心跳包
    this.sendMsg(this.opt.keepAliveMsg);
  }

  /**
   * @description 向服务端发送消息
   * @author LiuTao
   * @param {string} msg
   * @memberof WSUtil
   */
  sendMsg (msg) {
    if (typeof msg === 'undefined' || msg == null) {
      // console.error('发送的消息不能为空！');
      return false;
    }
    if (typeof msg !== 'string') {
      try {
        msg = msg.toString();
        this.ws.send(msg);
      } catch (e) {
        // console.error('未知错误：', e);
      }
    } else {
      this.ws.send(msg);
    }
  }

  isWsOpen () {
    return this._isWsOpen;
  }

  /**
   * @description 主动关闭socket连接
   * @author LiuTao
   * @memberof WSUtil
   */
  closeConnect () {
    this.timer && clearInterval(this.timer);
    this.forceReconnect = false;
    this.opt.needReconnect = false;
    this.ws.close();
    this.ws = null;
  }
}
