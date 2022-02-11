import axios from 'axios'

const service = axios.create({
    baseURL: process.env.NODE_ENV === 'development' ? '/' : `${window.location.origin}/`,
    timeout: 5000
})

service.interceptors.request.use(
    (config) => {
        // TODO，网络支持多以后可以做成配置化
        const curChainId = window.localStorage.getItem('curChainId')
        if (curChainId == 80001) {
            config.url = config.url.replace('/api/', '/matic/api/')
        }
        return config
    },
    (error) => {
        console.log(error)
        return Promise.reject()
    }
)

service.interceptors.response.use(
    (response) => {
        if (response.status === 200) {
            return response.data
        } else {
            Promise.reject()
        }
    },
    (error) => {
        console.log(error)
        return Promise.reject()
    }
)

export default service
