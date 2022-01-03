import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'Home',
        component: Home
    },
    {
        path: '/about',
        name: 'About',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
    },
    {
        path: '/trade',
        name: 'Trade',
        component: () => import(/* webpackChunkName: "trade" */ '../views/Trade')
    },
    {
        path: '/pool',
        component: () => import(/* webpackChunkName: "pool" */ '../views/Liquidity'),
        children: [
            {
                path: '',
                name: 'Pool',
                component: () => import(/* webpackChunkName: "pool-add" */ '../views/Liquidity/Liquidity')
            },
            {
                path: 'add',
                redirect: 'add/usdt',
                name: 'PoolAdd',
                component: () => import(/* webpackChunkName: "pool-add" */ '../views/Liquidity/Add')
            },
            {
                path: 'add/:currency',
                component: () => import(/* webpackChunkName: "pool-add" */ '../views/Liquidity/Add')
            },
            {
                path: 'add/:currency/:token',
                component: () => import(/* webpackChunkName: "pool-add" */ '../views/Liquidity/Add')
            }
        ]
    },
    {
        path: '/dataDetails',
        name: 'DataDetails',
        component: () => import(/* webpackChunkName: "dataDetails" */ '../views/DataDetails')
    },
    {
        path: '/statistics',
        name: 'Statistics',
        component: () => import(/* webpackChunkName: "statistics" */ '../views/Statistics')
    }
    // { path: '*', component: NotFoundComponent }
]

const router = new VueRouter({
    mode: process.env.NODE_ENV === 'development' ? 'hash' : 'history',
    routes
})

export default router
