import axios from 'axios'
import { getNetUrl } from '@/utils/util'

const service = axios.create({
    baseURL: process.env.NODE_ENV === 'development' ? '/' : `${window.location.origin}/`,
    timeout: 5000
})

service.interceptors.request.use(
    (config) => {
        config.url = getNetUrl(config.url)
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
