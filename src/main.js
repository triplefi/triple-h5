import Vue from 'vue'
import App from './App.vue'

import router from './router'
import store from './store'
import mixin from './components/mixin'
import { formatDateTime, formatMoney, formatNum, getCoinIcon } from './utils/util'

import ElementUI from 'element-ui'
// import 'element-ui/lib/theme-chalk/index.css'
import './assets/style/element-variables.scss'
import './assets/style/style.scss'

import './icons'

Vue.config.productionTip = false

Vue.use(ElementUI)

Vue.mixin(mixin)

Vue.filter('formatDateTime', formatDateTime)
Vue.filter('formatMoney', formatMoney)
Vue.filter('formatNum', formatNum)
Vue.filter('getCoinIcon', getCoinIcon)

new Vue({
    router,
    store,
    render: (h) => h(App)
}).$mount('#app')
