import { mapState } from 'vuex'
export default {
    computed: {
        ...mapState(['isNetworkError'])
    },
    watch: {
        isNetworkError: {
            handler(v) {
                if (v) {
                    if (!window.isShowNetworkError) {
                        this.$alert(
                            'Please connect your wallet and select a network. Currently Polygon, Mumbai and Meteore are supported on TripleFi.',
                            'Select a network',
                            {
                                confirmButtonText: 'Confirm',
                                callback() {
                                    window.isShowNetworkError = false
                                }
                            }
                        )
                        window.isShowNetworkError = true
                    }
                }
            },
            immediate: true
        }
    }
}
